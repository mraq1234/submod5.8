debugger;

var options = {
  method: 'PATCH',
  url: 'https://mraq.eu.auth0.com/v2/users/58c893691e43cf443052f75a',
  headers: { 'content-type': 'application/json' },
  data: {
    user_metadata: {
      givenName: 'Kacper',
      surname: 'Grzeszczyk',
      streetAddress: 'aksduajhd',
      city: 'Gdynia',
      state: 'Pomorskie',
      zip: '23-323'
    }
  }
};

$('.login.btn').click(function (event) {
  event.preventDefault();
  $.ajax(options);
});