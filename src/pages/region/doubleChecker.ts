import { AbstractControl } from '@angular/forms';

export const doubleChecker = (control: AbstractControl): {[key: string]: boolean} => {
  const pays = control.get('pays');
  const region = control.get('region');
  if (!pays || !region) {
    return null;
  }
};