export type SteedosProfileTypeConfig = {
    name: string,
    label: string,
    type: 'profile',
    license: string,
    assigned_apps: Array<string>,
    is_system: boolean,
    password_history: string,
    max_login_attempts: string,
    is_external: boolean,
    lockout_interval: string
}

export enum SteedosInternalProfile {
    Admin = 'admin',
    User = 'user'
}

export enum SteedosExternalProfile {
    Supplier = 'supplier',
    Customer = 'customer'
}