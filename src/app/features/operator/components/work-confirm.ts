import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';

import { ConfirmModal, ConfirmModalData } from '../../../shared/dialogs/confirm-modal/confirm-modal';

// confirmaciones de la vista antes de iniciar o finalizar (mismos textos en todas las pantallas)

export function confirmStart(dialog: MatDialog, code: string): Observable<boolean> {
  return ask(dialog, {
    title: 'ASSIGNED_SERVICES.DETAIL.START_TITLE',
    message: 'ASSIGNED_SERVICES.DETAIL.START_MESSAGE',
    messageParams: { code },
    confirmText: 'ASSIGNED_SERVICES.DETAIL.START_CONFIRM',
    cancelText: 'COMMON.CANCEL',
    danger: false
  });
}

export function confirmFinish(dialog: MatDialog, code: string): Observable<boolean> {
  return ask(dialog, {
    title: 'SCHEDULE.FINISH_TITLE',
    message: 'SCHEDULE.FINISH_MESSAGE',
    messageParams: { code },
    confirmText: 'SCHEDULE.FINISH_CONFIRM',
    cancelText: 'COMMON.CANCEL',
    danger: false
  });
}

function ask(dialog: MatDialog, data: ConfirmModalData): Observable<boolean> {
  return dialog.open(ConfirmModal, { panelClass: 'custom-dialog', data })
    .afterClosed()
    .pipe(map(confirmed => !!confirmed));
}
