import ApiClient from './ApiClient.js';

class ClientAppApi extends ApiClient {
  constructor() {
    super(process.env.AUTH_API_URL || 'https://www.rahulshettyacademy.com/api/ecom/auth/login');
  }

  async login(email, password) {
    const response = await this.post('', {
      userEmail: email,
      userPassword: password
    });

    if (!response.ok) {
      throw new Error(`Login API failed with status ${response.status}`);
    }

    return response.body.token;
  }
}

export default new ClientAppApi();
