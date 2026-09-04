const { getAuthorizedApps, proxyZohoRequest, ROLE_TO_ZOHO_APP } = require('../services/zohoService');
const User = require('../models/User');

/**
 * Get authorized Zoho apps for the current user
 */
exports.getAuthorizedApps = async (req, res) => {
  try {
    const roles = await User.getRoles(req.user.userId);
    const apps = getAuthorizedApps(roles.map(r => r.name));
    res.json({ apps });
  } catch (error) {
    console.error('Get authorized apps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Proxy request to Zoho API based on role and app
 */
exports.proxyRequest = async (req, res) => {
  const { app, endpoint } = req.params;
  const { method = 'GET' } = req.query;

  try {
    // Verify user has permission for this app
    const roles = await User.getRoles(req.user.userId);
    const roleNames = roles.map(r => r.name);

    let hasPermission = false;
    for (const role of roleNames) {
      const appConfig = ROLE_TO_ZOHO_APP[role];
      if (appConfig && appConfig.app === app) {
        hasPermission = true;
        break;
      }
    }

    if (!hasPermission) {
      return res.status(403).json({
        message: `Access Denied: User does not have permission for ${app}`
      });
    }

    // Build the full Zoho API URL
    const appConfig = Object.values(ROLE_TO_ZOHO_APP).find(a => a.app === app);
    if (!appConfig) {
      return res.status(400).json({ message: 'Invalid app' });
    }

    // Map app to base URL
    const baseUrls = {
      crm: 'https://www.zohoapis.com/crm/v2',
      people: 'https://people.zoho.com/people/api',
      desk: 'https://desk.zoho.com/api/v1',
      books: 'https://books.zoho.com/api/v3',
    };

    const baseUrl = baseUrls[app];
    if (!baseUrl) {
      return res.status(400).json({ message: 'Invalid app' });
    }

    const fullUrl = `${baseUrl}/${endpoint}`;
    const data = await proxyZohoRequest(
      fullUrl,
      method,
      req.body,
      req.query
    );

    res.json(data);
  } catch (error) {
    console.error('Zoho proxy error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      message: 'Zoho API error',
      error: error.response?.data || error.message,
    });
  }
};