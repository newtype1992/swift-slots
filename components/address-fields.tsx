"use client";

import { AddressAutofill } from "@mapbox/search-js-react";

type AddressFieldsProps = {
  section: string;
  addressLine1Name: string;
  addressLine1Id: string;
  addressLine1Label: string;
  addressLine1Value?: string | null;
  addressLine2Name?: string;
  addressLine2Id?: string;
  addressLine2Label?: string;
  addressLine2Value?: string | null;
  cityName: string;
  cityId: string;
  cityValue?: string | null;
  provinceName: string;
  provinceId: string;
  provinceValue?: string | null;
  postalCodeName: string;
  postalCodeId: string;
  postalCodeValue?: string | null;
  countryCodeName?: string;
  countryCodeValue?: string;
  helperText?: string;
  addressLine1Required?: boolean;
};

const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

function autocomplete(section: string, field: string) {
  return `section-${section} shipping ${field}`;
}

export function AddressFields({
  section,
  addressLine1Name,
  addressLine1Id,
  addressLine1Label,
  addressLine1Value,
  addressLine2Name = "addressLine2",
  addressLine2Id = "address-line2",
  addressLine2Label = "Address line 2",
  addressLine2Value,
  cityName,
  cityId,
  cityValue,
  provinceName,
  provinceId,
  provinceValue,
  postalCodeName,
  postalCodeId,
  postalCodeValue,
  countryCodeName = "countryCode",
  countryCodeValue = "CA",
  helperText,
  addressLine1Required = false,
}: AddressFieldsProps) {
  const line1Input = (
    <input
      id={addressLine1Id}
      name={addressLine1Name}
      type="text"
      defaultValue={addressLine1Value ?? ""}
      autoComplete={autocomplete(section, "address-line1")}
      placeholder="123 Example Street"
      required={addressLine1Required}
    />
  );

  return (
    <>
      <input type="hidden" name={countryCodeName} value={countryCodeValue} />
      <div className="field">
        <label htmlFor={addressLine1Id}>{addressLine1Label}</label>
        {accessToken ? (
          <AddressAutofill
            accessToken={accessToken}
            options={{
              country: countryCodeValue,
              language: "en",
            }}
            browserAutofillEnabled
          >
            {line1Input}
          </AddressAutofill>
        ) : (
          line1Input
        )}
        {helperText ? <p className="helper">{helperText}</p> : null}
      </div>

      <div className="field">
        <label htmlFor={addressLine2Id}>{addressLine2Label}</label>
        <input
          id={addressLine2Id}
          name={addressLine2Name}
          type="text"
          defaultValue={addressLine2Value ?? ""}
          autoComplete={autocomplete(section, "address-line2")}
          placeholder="Suite, floor, unit"
        />
      </div>

      <div className="grid two">
        <div className="field">
          <label htmlFor={cityId}>City</label>
          <input
            id={cityId}
            name={cityName}
            type="text"
            defaultValue={cityValue ?? ""}
            autoComplete={autocomplete(section, "address-level2")}
            placeholder="Montreal"
          />
        </div>
        <div className="field">
          <label htmlFor={provinceId}>Province</label>
          <input
            id={provinceId}
            name={provinceName}
            type="text"
            defaultValue={provinceValue ?? ""}
            autoComplete={autocomplete(section, "address-level1")}
            placeholder="QC"
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={postalCodeId}>Postal code</label>
        <input
          id={postalCodeId}
          name={postalCodeName}
          type="text"
          defaultValue={postalCodeValue ?? ""}
          autoComplete={autocomplete(section, "postal-code")}
          placeholder="H2T 1S6"
        />
      </div>
    </>
  );
}
