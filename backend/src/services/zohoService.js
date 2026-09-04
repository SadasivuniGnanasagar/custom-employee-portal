const axios = require('axios');

// Zoho application base URLs by data center
const ZOHO_API_BASE = {
  crm: 'https://www.zohoapis.com/crm/v2',
  people: 'https://people.zoho.com/people/api',
  desk: 'https://desk.zoho.com/api/v1',
  books: 'https://books.zoho.com/api/v3',
};

// Role to Zoho app mapping
const ROLE_TO_ZOHO_APP = {
  HR: { app: 'people', label: 'Zoho People', icon: '👥' },
  Sales: { app: 'crm', label: 'Zoho CRM', icon: '📊' },
  Support: { app: 'desk', label: 'Zoho Desk', icon: '🎫' },
  Finance: { app: 'books', label: 'Zoho Books', icon: '💰' },
};

// Role to permission mapping
const ROLE_TO_PERMISSION = {
  HR: 'access_zoho_people',
  Sales: 'access_zoho_crm',
  Support: 'access_zoho_desk',
  Finance: 'access_zoho_books',
};

/**
 * Get a new access token using the refresh token
 * Reference: Zoho OAuth refresh token flow[reference:0]
 */
async function getZohoAccessToken() {
  try {
    const response = await axios.post(
      `${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`,
      null,
      {
        params: {
          refresh_token: process.env.ZOHO_REFRESH_TOKEN,
          client_id: process.env.ZOHO_CLIENT_ID,
          client_secret: process.env.ZOHO_CLIENT_SECRET,
          grant_type: 'refresh_token',
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('Failed to retrieve Zoho Access Token:', error.response?.data || error.message);
    throw new Error('Zoho token refresh failed');
  }
}

/**
 * Get the Zoho application URL for a given role
 */
function getZohoAppUrl(role) {
  const appConfig = ROLE_TO_ZOHO_APP[role];
  if (!appConfig) return null;

  const baseUrl = ZOHO_API_BASE[appConfig.app];
  return {
    apiBase: baseUrl,
    label: appConfig.label,
    icon: appConfig.icon,
    app: appConfig.app,
  };
}

/**
 * Get authorized Zoho apps for a user based on their roles
 */
function getAuthorizedApps(roles) {
  const apps = [];
  for (const role of roles) {
    const appConfig = ROLE_TO_ZOHO_APP[role];
    if (appConfig && !apps.find(a => a.app === appConfig.app)) {
      apps.push({
        ...appConfig,
        role,
        permission: ROLE_TO_PERMISSION[role],
      });
    }
  }
  return apps;
}

/**
 * Proxy a request to Zoho API
 */
async function proxyZohoRequest(endpoint, method = 'GET', data = null, queryParams = {}) {
  const accessToken = await getZohoAccessToken();

  const url = new URL(endpoint);
  Object.keys(queryParams).forEach(key => {
    url.searchParams.append(key, queryParams[key]);
  });

  const response = await axios({
    method,
    url: url.toString(),
    headers: {
      'Authorization': `Zoho-oauthtoken ${accessToken}`,
      'Content-Type': 'application/json',
    },
    data,
  });

  return response.data;
}

/**
 * Zoho CRM: Get records from a module[reference:1]
 */
async function getZohoCRMRecords(moduleName, params = {}) {
  const endpoint = `${ZOHO_API_BASE.crm}/${moduleName}`;
  return proxyZohoRequest(endpoint, 'GET', null, params);
}

/**
 * Zoho People: Get employees
 */
async function getZohoPeopleEmployees(params = {}) {
  const endpoint = `${ZOHO_API_BASE.people}/employees`;
  return proxyZohoRequest(endpoint, 'GET', null, params);
}

/**
 * Zoho Desk: Get tickets[reference:2]
 */
async function getZohoDeskTickets(params = {}) {
  const endpoint = `${ZOHO_API_BASE.desk}/tickets`;
  return proxyZohoRequest(endpoint, 'GET', null, params);
}

/**
 * Zoho Books: Get contacts[reference:3]
 */
async function getZohoBooksContacts(params = {}) {
  const endpoint = `${ZOHO_API_BASE.books}/contacts`;
  return proxyZohoRequest(endpoint, 'GET', null, params);
}

module.exports = {
  getZohoAccessToken,
  getZohoAppUrl,
  getAuthorizedApps,
  proxyZohoRequest,
  getZohoCRMRecords,
  getZohoPeopleEmployees,
  getZohoDeskTickets,
  getZohoBooksContacts,
  ROLE_TO_ZOHO_APP,
  ROLE_TO_PERMISSION,
};