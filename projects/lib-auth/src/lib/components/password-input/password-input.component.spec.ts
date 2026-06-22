import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponenteContrasenaConmutable } from './password-input.component';

describe('ComponenteContrasenaConmutable', () => {
  let fixture: ComponentFixture<ComponenteContrasenaConmutable>;
  let componente: ComponenteContrasenaConmutable;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponenteContrasenaConmutable],
    }).compileComponents();

    fixture    = TestBed.createComponent(ComponenteContrasenaConmutable);
    componente = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(componente).toBeTruthy();
  });

  // ── writeValue ─────────────────────────────────────────────────────────────

  it('writeValue() debería asignar el valor recibido', () => {
    componente.writeValue('secreta');
    expect(componente.value).toBe('secreta');
  });

  it('writeValue() debería usar cadena vacía cuando recibe null', () => {
    componente.writeValue(null);
    expect(componente.value).toBe('');
  });

  // ── ControlValueAccessor ───────────────────────────────────────────────────

  it('registerOnChange() debería registrar la función de callback', () => {
    const fn = jasmine.createSpy('onChange');
    componente.registerOnChange(fn);
    componente.onChange('abc');
    expect(fn).toHaveBeenCalledWith('abc');
  });

  it('registerOnTouched() debería registrar la función de callback', () => {
    const fn = jasmine.createSpy('onTouched');
    componente.registerOnTouched(fn);
    componente.onTouched();
    expect(fn).toHaveBeenCalled();
  });

  it('setDisabledState() debería actualizar la propiedad disabled', () => {
    componente.setDisabledState(true);
    expect(componente.disabled).toBeTrue();

    componente.setDisabledState(false);
    expect(componente.disabled).toBeFalse();
  });

  // ── onInput ────────────────────────────────────────────────────────────────

  it('onInput() debería actualizar el valor y emitir onChange', () => {
    const fn = jasmine.createSpy('onChange');
    componente.registerOnChange(fn);

    const evento = { target: { value: 'nueva123' } } as unknown as Event;
    componente.onInput(evento);

    expect(componente.value).toBe('nueva123');
    expect(fn).toHaveBeenCalledWith('nueva123');
  });

  // ── onFocus / onBlur ───────────────────────────────────────────────────────

  it('onFocus() debería marcar isFocused como true', () => {
    componente.onFocus();
    expect(componente.isFocused).toBeTrue();
  });

  it('onBlur() debería marcar isFocused como false y llamar onTouched', () => {
    const fn = jasmine.createSpy('onTouched');
    componente.registerOnTouched(fn);
    componente.isFocused = true;

    componente.onBlur();

    expect(componente.isFocused).toBeFalse();
    expect(fn).toHaveBeenCalled();
  });

  // ── togglePasswordVisibility / inputType ─────────────────────────────────

  it('inputType debería ser "password" por defecto', () => {
    expect(componente.inputType).toBe('password');
  });

  it('togglePasswordVisibility() debería cambiar inputType a "text"', () => {
    componente.togglePasswordVisibility();
    expect(componente.inputType).toBe('text');
  });

  it('togglePasswordVisibility() doble llamada debería volver a "password"', () => {
    componente.togglePasswordVisibility();
    componente.togglePasswordVisibility();
    expect(componente.inputType).toBe('password');
  });

  // ── hasError ──────────────────────────────────────────────────────────────

  it('hasError debería ser false cuando error es null', () => {
    componente.error = null;
    expect(componente.hasError).toBeFalse();
  });

  it('hasError debería ser true cuando hay un mensaje de error', () => {
    componente.error = 'La contraseña es muy corta';
    expect(componente.hasError).toBeTrue();
  });

  // ── inputClasses ──────────────────────────────────────────────────────────

  it('inputClasses debería incluir solo form-control en estado neutro', () => {
    componente.isFocused = false;
    componente.error     = null;
    expect(componente.inputClasses).toBe('form-control');
  });

  it('inputClasses debería incluir is-focused cuando el campo tiene foco', () => {
    componente.isFocused = true;
    componente.error     = null;
    expect(componente.inputClasses).toContain('is-focused');
  });

  it('inputClasses debería incluir is-invalid cuando hay error', () => {
    componente.isFocused = false;
    componente.error     = 'Error';
    expect(componente.inputClasses).toContain('is-invalid');
  });
});
