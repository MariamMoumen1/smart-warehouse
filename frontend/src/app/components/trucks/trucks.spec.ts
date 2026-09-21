import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Trucks } from './trucks';

describe('Trucks', () => {
  let component: Trucks;
  let fixture: ComponentFixture<Trucks>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trucks],
    }).compileComponents();

    fixture = TestBed.createComponent(Trucks);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
