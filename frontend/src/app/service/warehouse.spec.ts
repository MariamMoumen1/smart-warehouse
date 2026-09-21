import { TestBed } from '@angular/core/testing';

import { Warehouse } from './warehouse';

describe('Warehouse', () => {
  let service: Warehouse;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Warehouse);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
