export function encodeBankInstitutionId(countryCode: string, name: string): string {
  return `${countryCode.toUpperCase()}|${name}`;
}

export function decodeBankInstitutionId(
  institutionId: string,
): { countryCode: string; name: string } {
  const separatorIndex = institutionId.indexOf('|');
  if (separatorIndex <= 0 || separatorIndex === institutionId.length - 1) {
    throw new Error(
      `Invalid institution id "${institutionId}". Expected format COUNTRY|Bank Name.`,
    );
  }

  return {
    countryCode: institutionId.slice(0, separatorIndex).toUpperCase(),
    name: institutionId.slice(separatorIndex + 1),
  };
}
