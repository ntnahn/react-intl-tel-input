/* eslint-disable no-eval, no-restricted-properties */
import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import fs from 'fs';
import IntlTelInput from '../src/components/IntlTelInputApp';
import TelInput from '../src/components/TelInput';
import FlagDropDown from '../src/components/FlagDropDown';

describe('TelInput', function () { // eslint-disable-line func-names
  let libphonenumberUtils;
  let getScript;
  let xhr;
  let requests;

  beforeAll(() => {
    libphonenumberUtils = fs.readFileSync('./src/libphonenumber.js', 'utf8');
  });

  afterAll(() => {
    xhr.restore();
  });

  beforeEach(() => {
    jest.resetModules();

    xhr = sinon.useFakeXMLHttpRequest();
    requests = [];
    xhr.onCreate = (req) => { requests.push(req); };
    document.body.innerHTML = '<div id="root"></div>';
    window.intlTelInputUtils = undefined;

    getScript = () =>
      document.getElementsByTagName('script')[0];

    this.params = {
      css: ['intl-tel-input', 'form-control phoneNumber'],
      fieldName: 'telephone',
      fieldId: 'telephone-id',
      defaultCountry: 'tw',
      defaultValue: '0999 123 456',
      utilsScript: 'assets/libphonenumber.js',
    };
    this.makeSubject = () => {
      return mount(
        <IntlTelInput
          { ...this.params }
        />, {
          attachTo: document.querySelector('#root'),
        },
      );
    };
  });

  it('should set fieldName as "telephone"', () => {
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    expect(inputComponent.props().fieldName).toBe('telephone');
  });

  it('should set fieldId as "telephone-id"', () => {
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    expect(inputComponent.props().fieldId).toBe('telephone-id');
  });

  it('onPhoneNumberChange without utilsScript', () => {
    let expected = '';
    const onPhoneNumberChange = (isValid, newNumber, countryData, fullNumber, ext) => {
      expected = `${isValid},${newNumber},${countryData.iso2},${fullNumber},${ext}`;
    };

    this.params.utilsScript = '';
    this.params.onPhoneNumberChange = onPhoneNumberChange;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    inputComponent.simulate('change', { target: { value: '+886911222333' } });
    expect(expected).toBe('false,+886911222333,tw,+886911222333,');
  });

  it('should set value as "0999 123 456"', async () => {
    const subject = await this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    expect(inputComponent.props().value).toBe('0999 123 456');
  });

  it('should set className', () => {
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    expect(inputComponent.find('.form-control.phoneNumber').length).toBeTruthy();
  });

  it('should not focused on render', () => {
    const initialSelectFlag = IntlTelInput.prototype.selectFlag;

    let focused = false;

    IntlTelInput.prototype.selectFlag = function selectFlag(countryCode, setFocus = true) {
      focused = focused || setFocus;
      initialSelectFlag.call(this, countryCode, setFocus);
    };

    this.params = {
      ...this.params,
      value: '+886901234567',
      preferredCountries: ['kr', 'jp', 'tw'],
    };
    this.makeSubject();

    IntlTelInput.prototype.selectFlag = initialSelectFlag;
    expect(focused).toBeFalsy();
  });


  it('should has "kr" in preferred countries state', () => {
    this.params = {
      ...this.params,
      defaultCountry: 'zz',
      preferredCountries: ['kr', 'jp', 'tw'],
    };
    const subject = this.makeSubject();

    expect(subject.state().countryCode).toBe('kr');
  });

  it('should set countryCode as "af" in state, when giving an invalid default country', () => {
    this.params = {
      ...this.params,
      preferredCountries: [],
      defaultValue: '',
      defaultCountry: 'zz',
    };
    const subject = this.makeSubject();

    expect(subject.state().countryCode).toBe('af');
  });

  it('getNumber without utilsScript', () => {
    this.params = {
      ...this.params,
      utilsScript: null,
    };
    const subject = this.makeSubject();

    expect(subject.instance().getNumber(1)).toBe('');
  });

  it('setNumber', () => {
    const subject = this.makeSubject();

    subject.instance().setNumber('+810258310015');
    expect(subject.state().countryCode).toBe('jp');
  });

  it('handleKeyUp', () => {
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    inputComponent.simulate('focus');
    inputComponent.simulate('keyDown', { keyCode: 35 });
    inputComponent.simulate('keyUp', {
      key: 'Backspace',
      keyCode: 8,
      which: 8,
    });
    inputComponent.simulate('change', {
      target: { value: '0999 123 45' },
    });
    expect(inputComponent.props().value).toBe('0999 123 45');
  });

  it('ensurePlus', () => {
    this.params = {
      ...this.params,
      nationalMode: false,
      defaultValue: '+886999111222345',
    };
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    inputComponent.simulate('focus');
    inputComponent.simulate('keyDown', { keyCode: 35 });
    const bspaceKey = {
      key: 'Backspace',
      keyCode: 8,
      which: 8,
    };

    inputComponent.simulate('keyUp', bspaceKey);
    inputComponent.simulate('keyUp', bspaceKey);
    inputComponent.simulate('keyUp', bspaceKey);
    inputComponent.simulate('change', {
      target: { value: '+886 999 111 222' },
    });
    expect(subject.state().value).toBe('+886 999 111 222');
  });

  it('Disabled nationalMode and input phone number', () => {
    this.params.nationalMode = false;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    inputComponent.simulate('change', { target: { value: '+886901234567' } });
    expect(inputComponent.props().value).toBe('+886901234567');
  });

  it('utils loaded', () => {
    this.makeSubject();
    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    expect(typeof window.intlTelInputUtils === 'object');
    expect(typeof window.intlTelInputUtils.isValidNumber === 'function');
  });

  it('onPhoneNumberChange', () => {
    let expected = '';
    const onPhoneNumberChange = (isValid, newNumber, countryData, fullNumber, ext) => {
      expected = `${isValid},${newNumber},${countryData.iso2},${fullNumber},${ext}`;
    };

    this.params.onPhoneNumberChange = onPhoneNumberChange;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    inputComponent.simulate('change', { target: { value: '+886911222333' } });
    expect(expected).toBe('true,+886911222333,tw,+886 911 222 333,null');
  });

  it('Blur and cleaning the empty dialcode', () => {
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    inputComponent.simulate('change', { target: { value: '+886' } });
    subject.instance().handleOnBlur();
    expect(subject.state().value).toBe('');
  });

  it('onPhoneNumberBlur', () => {
    let expected = '';
    const onPhoneNumberBlur = (isValid, newNumber, countryData, fullNumber, ext) => {
      expected = `${isValid},${newNumber},${countryData.iso2},${fullNumber},${ext}`;
    };

    this.params.onPhoneNumberBlur = onPhoneNumberBlur;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    inputComponent.simulate('change', { target: { value: '+886911222333' } });
    inputComponent.simulate('blur');
    expect(expected).toBe('true,+886911222333,tw,+886 911 222 333,null');
  });

  it('should has empty value with false nationalMode, false autoHideDialCode and false separateDialCode', () => {
    this.params = {
      ...this.params,
      defaultValue: '',
      nationalMode: false,
      autoHideDialCode: false,
      separateDialCode: false,
    };
    const subject = this.makeSubject();

    expect(subject.state().value).toBe('+886');
  });

  it('updateFlagFromNumber', () => {
    this.params = {
      defaultCountry: 'us',
      nationalMode: true,
    };
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    inputComponent.simulate('change', { target: { value: '9183319436' } });
    expect(subject.state().countryCode).toBe('us');

    inputComponent.simulate('change', { target: { value: '+' } });
    expect(subject.state().countryCode).toBe('us');
  });

  it('isValidNumber', () => {
    const subject = this.makeSubject();

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    expect(subject.instance().isValidNumber('0910123456')).toBeTruthy();
    expect(subject.instance().isValidNumber('091012345')).toBeFalsy();
  });

  it('getFullNumber', () => {
    this.params = {
      ...this.params,
      separateDialCode: true,
    };
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    inputComponent.simulate('change', { target: { value: '910123456' } });
    expect(subject.instance().getFullNumber(910123456)).toBe('+886910123456');
  });

  it('should render custom placeholder', () => {
    this.params.placeholder = 'foo';
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    requests[0].respond(200,
      { 'Content-Type': 'text/javascript' },
      libphonenumberUtils);
    window.eval(getScript().text);

    expect(inputComponent.props().placeholder).toBe('foo');
  });

  // FIXME: Enzyme not support :focus in current time
  xit('should focus input when autoFocus set to true', () => {
    this.params.autoFocus = true;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    expect(inputComponent.is(':focus')).toBeTruthy();
  });

  it('should not focus input when autoFocus set to false', () => {
    this.params.autoFocus = false;
    const subject = this.makeSubject();
    const inputComponent = subject.find(TelInput);

    expect(document.activeElement).not.toBe(inputComponent);
  });

  describe('when mobile useragent', () => {
    let defaultUserAgent;

    beforeEach(() => {
      defaultUserAgent = navigator.userAgent;
      window.navigator.__defineGetter__('userAgent', () => 'iPhone');
    });

    afterEach(() => {
      window.navigator.__defineGetter__('userAgent', () => defaultUserAgent);
    });

    it('sets FlagDropDown "dropdowncontainer" prop to "body"', () => {
      const subject = this.makeSubject();
      const flagDropdownComponent = subject.find(FlagDropDown);

      expect(flagDropdownComponent.props().dropdownContainer).toBe('body');
    });

    it('sets FlagDropDown "isMobile" prop to true', () => {
      const subject = this.makeSubject();
      const flagDropdownComponent = subject.find(FlagDropDown);

      expect(flagDropdownComponent.props().isMobile).toBeTruthy();
    });

    it('sets "iti-mobile" class to "body"', () => {
      expect(document.body.className).toBe('iti-mobile');
    });

    it(`does not set FlagDropDown "dropdowncontainer" to "body"
       when "useMobileFullscreenDropdown" set to false`, () => {
      this.params.useMobileFullscreenDropdown = false;
      const subject = this.makeSubject();
      const flagDropdownComponent = subject.find(FlagDropDown);

      expect(flagDropdownComponent.props().dropdownContainer).toBe('');
    });
  });

  describe('controlled', () => {
    it('should set the value', () => {
      const subject = this.makeSubject();

      expect(subject.state().value).toBe('0999 123 456');
    });

    it('should not change input value if value is constrained by parent', () => {
      this.params.value = '0999 123 456';
      const subject = this.makeSubject();
      const inputComponent = subject.find(TelInput);

      inputComponent.simulate('change', { target: { value: '12345' } });
      expect(subject.state().value).toBe('0999 123 456');
    });

    it('should change input value on value prop change', () => {
      const subject = this.makeSubject();
      const inputComponent = subject.find(TelInput);

      subject.setProps({ value: 'foo bar' });
      expect(inputComponent.props().value).toBe('foo bar');
    });
  });

  describe('uncontrolled', () => {
    it('should initialize state with defaultValue', () => {
      this.params.defaultValue = '54321';
      const subject = this.makeSubject();
      const inputComponent = subject.find(TelInput);

      expect(inputComponent.props().value).toBe('54321');
      expect(subject.state().value).toBe('54321');
    });

    it('should change value', () => {
      this.params.defaultValue = '';
      const subject = this.makeSubject();
      const inputComponent = subject.find(TelInput);

      inputComponent.simulate('change', { target: { value: '12345' } });
      expect(inputComponent.props().value).toBe('12345');
      expect(subject.state().value).toBe('12345');
    });

    it('should change props value', () => {
      const subject = this.makeSubject();
      const inputComponent = subject.find(TelInput);

      requests[0].respond(200,
        { 'Content-Type': 'text/javascript' },
        libphonenumberUtils);
      window.eval(getScript().text);

      subject.setState({
        value: '+886912345678',
      });
      expect(inputComponent.props().value).toBe('+886912345678');
    });
  });
});
