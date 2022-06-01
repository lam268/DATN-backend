enum ConfigKey {
    NODE_ENV = 'NODE_ENV',
    PORT = 'PORT',
    BASE_PATH = 'BASE_PATH',
    LOG_LEVEL = 'LOG_LEVEL',
    LOG_ROOT_FOLDER = 'LOG_ROOT_FOLDER',
    DB_HOST = 'DB_HOST',
    DB_PORT = 'DB_PORT',
    DB_USERNAME = 'DB_USERNAME',
    DB_PASSWORD = 'DB_PASSWORD',
    DB_NAME = 'DB_NAME',
    DB_TYPE = 'mysql',
    JWT_SECRET_ACCESS_TOKEN_KEY = 'JWT_SECRET_ACCESS_TOKEN_KEY',
    JWT_SECRET_REFRESH_TOKEN_KEY = 'JWT_SECRET_REFRESH_TOKEN_KEY',
    TOKEN_EXPIRED_IN = 'TOKEN_EXPIRED_IN',
    REFRESH_TOKEN_EXPIRED_IN = 'REFRESH_TOKEN_EXPIRED_IN',
    CORS_WHITE_LIST = 'CORS_WHITE_LIST',
    GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID',
    GOOGLE_CLIENT_SECRET = 'GOOGLE_CLIENT_SECRET',
    AWS_ACCESS_KEY_ID = 'AWS_ACCESS_KEY_ID',
    AWS_SECRET_ACCESS_KEY = 'AWS_SECRET_ACCESS_KEY',
    AWS_REGION = 'AWS_REGION',
    AWS_S3_BUCKET = 'AWS_S3_BUCKET',
    AWS_S3_DOMAIN = 'AWS_S3_DOMAIN',
    CRON_JOB_CONTRACT_UPDATE_STATUS = 'CRON_JOB_CONTRACT_UPDATE_STATUS',
    MAX_REQUEST_SIZE = 'MAX_REQUEST_SIZE',
    SLACK_ADMIN_ID = 'SLACK_ADMIN_ID',
    SLACK_TIMEKEEPING_CHANNEL = 'SLACK_TIMEKEEPING_CHANNEL',
}

export default ConfigKey;
