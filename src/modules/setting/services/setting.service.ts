import { Injectable } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import { Asset } from 'src/modules/asset/entity/asset.entity';
import { GlobalDataService } from 'src/modules/common/services/global-data.service';
import { GeneralSettings } from 'src/modules/common/entity/general-settings.entity';
import { User } from 'src/modules/user/entity/user.entity';
import { EntityManager, In, Not } from 'typeorm';
import {
    GeneralSettingDto,
    GeneralSettingValueDto,
} from '../dto/request/general-setting.dto';
import { SettingKey, settingListAtttributes } from '../setting.constant';
import { UserService } from 'src/modules/user/services/user.service';
import reduce from 'lodash/reduce';
import { AssetService } from 'src/modules/asset/services/asset.service';
import { RecruitmentService } from 'src/modules/recruitment/service/candidate.service';

@Injectable()
export class SettingService {
    constructor(
        @InjectEntityManager()
        private readonly dbManager: EntityManager,
        private readonly globalDataService: GlobalDataService,
        private readonly userService: UserService,
        private readonly assetService: AssetService,
        private readonly recruitmentService: RecruitmentService,
    ) {}

    async getSettingByKey(key: SettingKey) {
        try {
            const setting = await this.dbManager.findOne(GeneralSettings, {
                select: settingListAtttributes,
                where: { key },
            });
            await this.mapingInUseForSettingData(setting, setting?.key);

            return setting;
        } catch (error) {
            throw error;
        }
    }

    async saveSetting(
        data: GeneralSettingDto<GeneralSettingValueDto | object>,
    ) {
        try {
            const setting = await this.dbManager.findOne(GeneralSettings, {
                where: {
                    key: data.key,
                },
            });
            const result = await this.dbManager.save(GeneralSettings, {
                ...data,
                id: setting?.id,
            });
            // Update global variable
            if (data.key == SettingKey.USER_POSITION) {
                this.globalDataService.getUserPositionList();
            } else if (data.key == SettingKey.ASSET_CATEGORY) {
                this.globalDataService.getAssetCategoryList();
            }

            await this.mapingInUseForSettingData(result, setting.key);

            return result;
        } catch (error) {
            throw error;
        }
    }

    // check if new userPositions data contains all position of users in user table
    async validateUserPosition(
        generalSetting: GeneralSettingDto<GeneralSettingValueDto>,
    ): Promise<boolean> {
        try {
            const positionCodes = generalSetting.values.map(
                (s: GeneralSettingValueDto) => s?.code,
            );

            const userCount = await this.dbManager.count(User, {
                where: {
                    position: Not(In([...positionCodes])),
                },
            });

            return userCount === 0;
        } catch (error) {
            throw error;
        }
    }

    // check if new assetCategory data contains all category of asset in asset table
    async validateAssetCategory(
        generalSetting: GeneralSettingDto<GeneralSettingValueDto>,
    ): Promise<boolean> {
        try {
            const assetCategoryCodes = generalSetting.values.map(
                (s: GeneralSettingValueDto) => s?.code,
            );

            const assetCount = await this.dbManager.count(Asset, {
                where: {
                    category: Not(In([...assetCategoryCodes])),
                },
            });

            return assetCount === 0;
        } catch (error) {
            throw error;
        }
    }

    async mapingInUseForSettingData(
        setting: GeneralSettings,
        key: SettingKey,
    ): Promise<void> {
        try {
            if (key === SettingKey.USER_POSITION) {
                const inUseUserPositions =
                    await this.userService.getInUseUserPosition();
                const mapInUseUserPositions: Record<string, boolean> = {};
                reduce(
                    inUseUserPositions || [],
                    function (obj: Record<string, boolean>, code) {
                        mapInUseUserPositions[code] = true;
                        return obj;
                    },
                    {},
                );
                setting.values = setting.values.map(
                    (item: GeneralSettingValueDto) => {
                        return {
                            ...item,
                            inUse: !!mapInUseUserPositions[item.code],
                        };
                    },
                );
            } else if (key === SettingKey.APPLIED_POSITION) {
                const inUseAppliedPositions =
                    await this.recruitmentService.getInUseAppliedPosition();
                const mapInUseAppliedPositions: Record<string, boolean> = {};
                reduce(
                    inUseAppliedPositions || [],
                    function (obj: Record<string, boolean>, code) {
                        mapInUseAppliedPositions[code] = true;
                        return obj;
                    },
                    {},
                );
                setting.values = setting.values.map(
                    (item: GeneralSettingValueDto) => {
                        return {
                            ...item,
                            inUse: !!mapInUseAppliedPositions[item.code],
                        };
                    },
                );
            } else if (key === SettingKey.ASSET_CATEGORY) {
                const inUseAssetCategories =
                    await this.assetService.getInUseAssetCategory();
                const mapInUseAssetCategories: Record<string, boolean> = {};
                reduce(
                    inUseAssetCategories || [],
                    function (obj: Record<string, boolean>, code) {
                        mapInUseAssetCategories[code] = true;
                        return obj;
                    },
                    {},
                );
                setting.values = setting.values.map(
                    (item: GeneralSettingValueDto) => {
                        return {
                            ...item,
                            inUse: !!mapInUseAssetCategories[item.code],
                        };
                    },
                );
            }
        } catch (error) {
            throw error;
        }
    }
}
