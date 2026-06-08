import ApiClient from './ApiClient.js';

class PetStoreClient extends ApiClient {
  constructor() {
    super(process.env.PETSTORE_API_URL || 'https://petstore.swagger.io/v2');
  }

  async createPet(pet) {
    return this.post('/pet', pet);
  }

  async getPetById(petId) {
    return this.get(`/pet/${petId}`);
  }

  async findPetsByStatus(status) {
    return this.get('/pet/findByStatus', {
      query: { status }
    });
  }
}

export default new PetStoreClient();
