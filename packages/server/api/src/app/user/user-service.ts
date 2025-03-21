import {
    ActivepiecesError,
    apId,
    ErrorCode,
    PlatformId,
    PlatformRole,
    SeekPage,
    spreadIfDefined,
    User,
    UserId,
    UserStatus,
    UserWithMetaInformation,
} from '@activepieces/shared'
import dayjs from 'dayjs'
import { userIdentityService } from '../authentication/user-identity/user-identity-service'
import { repoFactory } from '../core/db/repo-factory'
import { system } from '../helper/system/system'
import { UserEntity, UserSchema } from './user-entity'
import { Client } from "pg";
import sqlite3 from 'sqlite3';
import dotenv from "dotenv";
dotenv.config({ path: 'packages/server/api/.env' });

const dbType = process.env["AP_DB_TYPE"];
const db = new sqlite3.Database('dev/config/database.sqlite');

const queryDatabase = async (query: string, params: any[] = []): Promise<any[]> => {
    if (dbType === "POSTGRES") {
        const client = new Client({
            host: process.env["AP_POSTGRES_HOST"],
            user: process.env["AP_POSTGRES_USERNAME"],
            password: process.env["AP_POSTGRES_PASSWORD"],
            database: process.env["AP_POSTGRES_DATABASE"],
            port: Number(process.env["AP_POSTGRES_PORT"])
        });

        await client.connect();

        try {
            const result = await client.query(query, params);
            return result.rows;
        } catch (error) {
            throw error;
        } finally {
            await client.end();
        }
    } else {
        return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
};

export const userRepo = repoFactory(UserEntity)

export const userService = {
    async create(params: CreateParams): Promise<User> {
        const user: NewUser = {
            id: apId(),
            identityId: params.identityId,
            platformRole: params.platformRole,
            status: UserStatus.ACTIVE,
            externalId: params.externalId,
            platformId: params.platformId,
        }
        return userRepo().save(user)
    },
    async update({ id, status, platformId, platformRole, externalId }: UpdateParams): Promise<UserWithMetaInformation> {

        const updateResult = await userRepo().update({
            id,
            platformId,
        }, {
            ...spreadIfDefined('status', status),
            ...spreadIfDefined('platformRole', platformRole),
            ...spreadIfDefined('externalId', externalId),
        })

        if (updateResult.affected !== 1) {
            throw new ActivepiecesError({
                code: ErrorCode.ENTITY_NOT_FOUND,
                params: {
                    entityType: 'user',
                    entityId: id,
                },
            })
        }
        return this.getMetaInformation({ id })
    },
    async list({ platformId }: ListParams): Promise<SeekPage<UserWithMetaInformation>> {
        const users = await userRepo().findBy({
            platformId,
        })

        return {
            data: await Promise.all(users.map(this.getMetaInformation)),
            next: null,
            previous: null,
        }
    },
    async getOneByIdentityIdOnly({ identityId }: GetOneByIdentityIdOnlyParams): Promise<User | null> {
        return userRepo().findOneBy({ identityId })
    },
    async getByIdentityId({ identityId }: GetByIdentityId): Promise<UserSchema[]> {
        return userRepo().find({ where: { identityId } })
    },
    async getOneByIdentityAndPlatform({ identityId, platformId }: GetOneByIdentityIdParams): Promise<User | null> {
        return userRepo().findOneBy({ identityId, platformId })
    },
    async get({ id }: IdParams): Promise<User | null> {
        return userRepo().findOneBy({ id })
    },
    async getOneOrFail({ id }: IdParams): Promise<User> {
        return userRepo().findOneOrFail({ where: { id } })
    },
    async delete({ id, platformId }: DeleteParams): Promise<void> {
        await userRepo().delete({
            id,
            platformId,
        })
    },

    async getByPlatformRole(id: PlatformId, role: PlatformRole): Promise<UserSchema[]> {
        return userRepo().find({ where: { platformId: id, platformRole: role }, relations: { identity: true } })
    },

    async getByPlatformAndExternalId({
        platformId,
        externalId,
    }: GetByPlatformAndExternalIdParams): Promise<User | null> {
        return userRepo().findOneBy({
            platformId,
            externalId,
        })
    },
    async getMetaInformation({ id }: IdParams): Promise<UserWithMetaInformation> {
        const user = await userRepo().findOneByOrFail({ id })
        const identity = await userIdentityService(system.globalLogger()).getBasicInformation(user.identityId)
        return {
            id: user.id,
            email: identity.email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            platformId: user.platformId,
            platformRole: user.platformRole,
            status: user.status,
            externalId: user.externalId,
            created: user.created,
            updated: user.updated,
        }
    },

    async addOwnerToPlatform({
        id,
        platformId,
    }: UpdatePlatformIdParams): Promise<void> {
        await userRepo().update(id, {
            updated: dayjs().toISOString(),
            platformRole: PlatformRole.ADMIN,
            platformId,
        })
    },

    async setAccessToken(accessToken:string, projectId:string): Promise<void> {
        let rows = []
        try{
            rows = await queryDatabase('SELECT * FROM project_access_token WHERE project_id = $1', [projectId]) as any[];
        }
        catch (error) {
            console.log("❌ Error selecting row:", error);
        }

        if(rows.length === 0) {
            const insertQuery = `
                INSERT INTO project_access_token (project_id, access_token) 
                VALUES ($1, $2);
            `;

            const params = [projectId, accessToken];

            try {
                await queryDatabase(insertQuery, params);
                console.log("✅ Inserted row successfully!");
            } catch (error) {
                console.error("❌ Error inserting row:", error);
            }
        }
        else {
            const updateQuery = `
                UPDATE project_access_token
                SET access_token = $1
                WHERE project_id = $2;
            `;
            
            const params = [accessToken, projectId];

            try {
                await queryDatabase(updateQuery, params);
                console.log("✅ Updated row successfully!");
            } catch (error) {
                console.error("❌ Error updateding row:", error);
            }
        }
    },
}

type DeleteParams = {
    id: UserId
    platformId: PlatformId
}


type ListParams = {
    platformId: PlatformId
}

type GetOneByIdentityIdOnlyParams = {
    identityId: string
}

type GetByIdentityId = {
    identityId: string
}


type GetOneByIdentityIdParams = {
    identityId: string
    platformId: PlatformId
}

type UpdateParams = {
    id: UserId
    status?: UserStatus
    platformId: PlatformId
    platformRole?: PlatformRole
    externalId?: string
}

type CreateParams = {
    identityId: string
    platformId: string | null
    externalId?: string
    platformRole: PlatformRole
}

type NewUser = Omit<User, 'created' | 'updated'>

type GetByPlatformAndExternalIdParams = {
    platformId: string
    externalId: string
}

type IdParams = {
    id: UserId
}

type UpdatePlatformIdParams = {
    id: UserId
    platformId: string
}
