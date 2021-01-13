import { SteedosProfileTypeConfig, SteedosInternalProfile, SteedosExternalProfile } from '../ts-types/profile';


export function getProfileSharingModal(profile: SteedosProfileTypeConfig){
    let {is_external:isExternal, name} = profile;

    switch (name) {
        case SteedosInternalProfile.Admin:
            isExternal = true;
            break;
        case SteedosInternalProfile.User:
            isExternal = true;
            break;
        case SteedosExternalProfile.Supplier:
            isExternal = false;
            break;
        case SteedosExternalProfile.Customer:
            isExternal = false;
            break;
        default:
            break;
    }


    

}