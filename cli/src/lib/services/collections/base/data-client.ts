import { Query, RestCommand } from '@directus/sdk';
import {
  DirectusBaseType,
  DirectusId,
  WithoutIdAndSyncId,
} from './interfaces';
import { MigrationClient } from '../../migration-client';

/**
 * This class is responsible for calling CRUD operations on the target collection using the rest API.
 */
export abstract class DataClient<DirectusType extends DirectusBaseType> {
  constructor(protected readonly migrationClient: MigrationClient) {}

  protected abstract getQueryCommand(
    query: Query<DirectusType, object>,
  ): RestCommand<DirectusType[], object>;

  protected abstract getInsertCommand(
    item: WithoutIdAndSyncId<DirectusType>,
  ): RestCommand<DirectusType, object>;

  protected abstract getUpdateCommand(
    itemId: DirectusId,
    diffItem: Partial<WithoutIdAndSyncId<DirectusType>>,
  ): RestCommand<DirectusType, object>;

  protected abstract getDeleteCommand(
    itemId: DirectusId,
  ): RestCommand<DirectusType, object>;

  /**
   * Request data from the target collection using the rest API.
   */
  async query<T extends object = DirectusType>(
    query: Query<DirectusType, object>,
  ): Promise<T[]> {
    const directus = await this.migrationClient.getClient();
    const response = await directus.request<T | T[]>(
      this.getQueryCommand(query),
    );
    // Some collections, such as settings, return a single object instead of an array or may return a fake item, without id.
    if (Array.isArray(response)) {
      return response;
    } else {
      if (!(response as DirectusType).id) {
        return [];
      }
      return [response as T];
    }
  }

  /**
   * Inserts data into the target collection using the rest API.
   * Remove the id and the syncId from the item before inserting it.
   */
  async create(
    item: WithoutIdAndSyncId<DirectusType>,
  ): Promise<DirectusType> {
    const directus = await this.migrationClient.getClient();
    return await directus.request(
      this.getInsertCommand(item),
    );
  }

  /**
   * Updates data in the target collection using the rest API.
   * The diff item already excludes the id and the syncId.
   */
  async update(
    itemId: DirectusId,
    diffItem: Partial<WithoutIdAndSyncId<DirectusType>>,
  ): Promise<DirectusType> {
    const directus = await this.migrationClient.getClient();
    return await directus.request(this.getUpdateCommand(itemId, diffItem));
  }

  /**
   * Deletes data from the target collection using the rest API.
   * The id is the local id.
   */
  async delete(itemId: DirectusId): Promise<DirectusType> {
    const directus = await this.migrationClient.getClient();
    return await directus.request(this.getDeleteCommand(itemId));
  }
}
