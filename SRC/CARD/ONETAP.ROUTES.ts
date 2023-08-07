import { Router } from "express";
import ValidateNITRORequest from "../../MIDDLEWARES/VALIDATE_REQUEST.MIDDLEWARE";
import {
  OTC_CARD_LINK_SCHEMA,
  OTC_MERCHANT_CREATE_SCHEMA,
  OTC_PAY_SCHEMA,
} from "./ONETAP.SCHEMA";
import {
  LinkCustomerOTC_,
  ONETAP_PAYMENT,
  RegisterOTC_Merchant,
} from "./ONETAPNFC";

const ONETAPCARDRouter = (
  Router: Router,
  ValidateAPIUser: any,
  ValidateOTCMerchant: any
) => {
  Router.post(
    "/OTC/CREATE_MERCHANT",
    ValidateAPIUser,
    ValidateNITRORequest(OTC_MERCHANT_CREATE_SCHEMA),
    RegisterOTC_Merchant
  );

  Router.post(
    "/OTC/LINK_CUST_CARD/TERMINAL",
    ValidateAPIUser,
    ValidateOTCMerchant,
    ValidateNITRORequest(OTC_CARD_LINK_SCHEMA),
    LinkCustomerOTC_
  );

  Router.post(
    "/OTC/LINK_CUST_CARD/MOBILE",
    ValidateAPIUser,
    ValidateOTCMerchant,
    ValidateNITRORequest(OTC_CARD_LINK_SCHEMA),
    LinkCustomerOTC_
  );

  Router.post(
    "/OTC/PAY",
    ValidateAPIUser,
    ValidateOTCMerchant,
    ValidateNITRORequest(OTC_PAY_SCHEMA),
    ONETAP_PAYMENT
  );
};

export default ONETAPCARDRouter;
