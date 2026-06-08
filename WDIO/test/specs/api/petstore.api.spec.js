import { expect } from '@wdio/globals';
import PetStoreClient from '../../../utils/api/PetStoreClient.js';
import { availablePet } from '../../data/petStorePets.js';

describe('Petstore API', () => {
  it('creates a pet using POST @api @smoke', async () => {
    const response = await PetStoreClient.createPet(availablePet);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(availablePet.id);
    expect(response.body.name).toBe(availablePet.name);
    expect(response.body.status).toBe(availablePet.status);
    expect(response.body.category.name).toBe(availablePet.category.name);
  });

  it('gets a created pet by id using GET @api', async () => {
    const createResponse = await PetStoreClient.createPet(availablePet);
    expect(createResponse.status).toBe(200);

    const getResponse = await PetStoreClient.getPetById(availablePet.id);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.id).toBe(availablePet.id);
    expect(getResponse.body.name).toBe(availablePet.name);
    expect(getResponse.body.status).toBe(availablePet.status);
  });

  it('finds available pets using query parameters @api', async () => {
    const response = await PetStoreClient.findPetsByStatus('available');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body.every((pet) => pet.status === 'available')).toBe(true);
  });
});
