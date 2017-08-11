import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import IntlTelInput from 'react-intl-tel-input'; // eslint-disable-line import/no-extraneous-dependencies

// import 'file-loader?name=libphonenumber.js!./libphonenumber.js';
// import './main.css';

const loadJSONP = (url, callback) => {
  const ref = window.document.getElementsByTagName('script')[0];
  const script = window.document.createElement('script');

  script.src = `${url + (url.indexOf('?') + 1 ? '&' : '?')}callback=${callback}`;
  ref.parentNode.insertBefore(script, ref);
  script.onload = () => {
    script.remove();
  };
};

const lookup = (callback) => {
  loadJSONP('http://ipinfo.io', 'sendBack');
  window.sendBack = (resp) => {
    const countryCode = (resp && resp.country) ? resp.country : '';

    callback(countryCode);
  };
};

function log(...args) {
  console.log(args);
}

class DemoComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      phone1: '',
      phone2: '',
    };
  }

  componentWillMount() {
    this.changePhone1 = this.changeHandler.bind(this, 'phone1');
    this.changePhone2 = this.changeHandler.bind(this, 'phone2');
  }

  changeHandler(name, isValid, value, countryData, number, ext) {
    log(isValid, value, countryData, number, ext);
    this.setState({
      [name]: value,
    });
  }

  blurHandler = (isValid, value, countryData, number, ext) => {
    log(isValid, value, countryData, number, ext);
  }

  render() {
    return (
      <div>
        <IntlTelInput
          onPhoneNumberChange={ this.changePhone1 }
          onPhoneNumberBlur={ this.blurHandler }
          defaultCountry={ 'auto' }
          value={ this.state.phone1 }
          geoIpLookup={ lookup }
          css={ ['intl-tel-input', 'form-control'] }
          utilsScript="libphonenumber.js"
          format
        />
        <div>Phone Number: {this.state.phone1 }</div>

        <IntlTelInput
          onPhoneNumberChange={ this.changePhone2 }
          onPhoneNumberBlur={ this.blurHandler }
          defaultCountry={ 'jp' }
          value={ this.state.phone2 }
          css={ ['intl-tel-input', 'form-control'] }
          utilsScript="libphonenumber.js"
        />
        <div>Phone Number: {this.state.phone2}</div>
      </div>
    );
  }
}

ReactDOM.render(
  <DemoComponent />,
  document.getElementById('root')
);
