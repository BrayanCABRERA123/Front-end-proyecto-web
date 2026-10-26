import { Component, DestroyRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { vi } from 'vitest';

import { LiveRefresh, REFRESH_MIN_GAP_MS, WAITING_POLL_MS, keepFresh } from './live-refresh';
import { NotificationWatcher } from './notification-watcher';

// pantalla mínima que se registra como lo hacen las páginas reales
@Component({ selector: 'app-fresh-host', template: '' })
class FreshHostComponent {
  static load = vi.fn();
  static poll = false;
  constructor() {
    keepFresh(silent => FreshHostComponent.load(silent), FreshHostComponent.poll ? { pollMs: WAITING_POLL_MS } : {});
  }
}

describe('LiveRefresh (WEB-16)', () => {
  const arrived = new Subject<void>();
  let hidden = false;

  beforeEach(() => {
    vi.useFakeTimers();
    hidden = false;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    FreshHostComponent.load = vi.fn();
    FreshHostComponent.poll = false;
    TestBed.configureTestingModule({
      providers: [{ provide: NotificationWatcher, useValue: { arrived } }],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (document as { hidden?: boolean }).hidden;
  });

  function backToTab(): void {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('focus'));
  }

  it('carga al entrar a la pantalla (sin silent)', () => {
    TestBed.createComponent(FreshHostComponent);

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(1);
    expect(FreshHostComponent.load).toHaveBeenCalledWith(false);
  });

  it('al volver a la pestaña recarga una sola vez aunque lleguen visibilitychange y focus juntos', () => {
    TestBed.createComponent(FreshHostComponent);
    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);

    backToTab();

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(2);
    expect(FreshHostComponent.load).toHaveBeenLastCalledWith(true);
  });

  it('no repite la petición si se acaba de cargar', () => {
    TestBed.createComponent(FreshHostComponent);

    backToTab();

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(1);
  });

  it('recarga cuando la bandeja detecta una notificación nueva', () => {
    TestBed.createComponent(FreshHostComponent);
    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);

    arrived.next();

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(2);
  });

  it('el refresco periódico solo corre con la pestaña visible', () => {
    FreshHostComponent.poll = true;
    TestBed.createComponent(FreshHostComponent);

    vi.advanceTimersByTime(WAITING_POLL_MS);
    expect(FreshHostComponent.load).toHaveBeenCalledTimes(2);

    hidden = true;
    vi.advanceTimersByTime(WAITING_POLL_MS * 3);
    expect(FreshHostComponent.load).toHaveBeenCalledTimes(2);
  });

  it('sin refresco periódico, el tiempo solo no dispara cargas', () => {
    TestBed.createComponent(FreshHostComponent);

    vi.advanceTimersByTime(WAITING_POLL_MS * 3);

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(1);
  });

  it('al salir de la pantalla deja de escuchar', () => {
    const fixture = TestBed.createComponent(FreshHostComponent);
    fixture.destroy();
    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);

    backToTab();
    arrived.next();

    expect(FreshHostComponent.load).toHaveBeenCalledTimes(1);
  });

  it('con initial: false no carga al registrarse (la pantalla ya lo hizo)', () => {
    const live = TestBed.inject(LiveRefresh);
    const load = vi.fn();
    const destroyRef = { onDestroy: () => () => undefined } as unknown as DestroyRef;

    live.watch(load, destroyRef, { initial: false });
    backToTab();
    expect(load).not.toHaveBeenCalled();

    vi.advanceTimersByTime(REFRESH_MIN_GAP_MS);
    backToTab();
    expect(load).toHaveBeenCalledWith(true);
  });
});
