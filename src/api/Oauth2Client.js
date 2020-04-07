import * as clientSecret from '../client_secret.json'

const {google} = require('googleapis')

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/admin.directory.user',
  'https://www.googleapis.com/auth/admin.directory.group',
  'https://www.googleapis.com/auth/admin.directory.orgunit',
  'https://www.googleapis.com/auth/spreadsheets']

/* eslint-disable camelcase */
const {client_secret, client_id} = clientSecret.web
const redirect_url = 'http://localhost:8080'

let oauth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_url)

  let token = JSON.parse(localStorage.getItem('token'))
  if (token != null) {
    alert(localStorage.getItem('token'))
    oauth2Client.setCredentials(token)
  }
  return oauth2Client
}

let oauth2ClientGenerateAuthUrl = () => {
  return oauth2Client().generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  })
}

let oauth2ClientService = () => {
  const auth = oauth2Client()
  return google.admin({version: 'directory_v1', auth})
}

/**
 * Lists the first 10 users in the domain.
 */
/*
function getDomainGroups() {
  oauth2ClientService().users.list({
    customer: 'my_customer',
    maxResults: 10,
    orderBy: 'email',
  }, (err, res) => {
    if (err) return console.error('The API returned an error:', err.message);

    const users = res.data.users;
    if (users.length) {
      console.log('Users:');
      users.forEach((user) => {
        console.log(`${user.primaryEmail} (${user.name.fullName})`);
      });
    } else {
      console.log('No users found.');
    }
  });
}
*/

export {oauth2Client, oauth2ClientGenerateAuthUrl, oauth2ClientService}
