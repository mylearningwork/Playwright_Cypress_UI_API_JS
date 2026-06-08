const uniquePetId = Number(`${Date.now()}`.slice(-9));

export const availablePet = {
  id: uniquePetId,
  category: {
    id: 101,
    name: 'dogs'
  },
  name: `wdio-api-pet-${uniquePetId}`,
  photoUrls: [
    'https://example.com/wdio-api-pet.png'
  ],
  tags: [
    {
      id: 201,
      name: 'api-test'
    }
  ],
  status: 'available'
};
