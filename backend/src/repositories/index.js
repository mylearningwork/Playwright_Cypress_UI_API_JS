import { env } from '../config/env.js';

let repository;

export async function getRepository() {
  if (repository) return repository;

  if (env.USE_IN_MEMORY) {
    const { memoryRepository } = await import('./memory-repository.js');
    repository = memoryRepository;
  } else {
    const { postgresRepository } = await import('./postgres-repository.js');
    repository = postgresRepository;
  }

  return repository;
}

export function setRepository(instance) {
  repository = instance;
}
