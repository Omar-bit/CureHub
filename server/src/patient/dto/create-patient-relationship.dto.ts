import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

export enum RelationshipType {
  FAMILY = 'FAMILY',
  OTHER = 'OTHER',
}

export enum FamilyRelationship {
  SON = 'SON',
  DAUGHTER = 'DAUGHTER',
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  BROTHER = 'BROTHER',
  SISTER = 'SISTER',
  SPOUSE = 'SPOUSE',
  GRANDFATHER = 'GRANDFATHER',
  GRANDMOTHER = 'GRANDMOTHER',
  GRANDSON = 'GRANDSON',
  GRANDDAUGHTER = 'GRANDDAUGHTER',
  UNCLE = 'UNCLE',
  AUNT = 'AUNT',
  NEPHEW = 'NEPHEW',
  NIECE = 'NIECE',
  COUSIN = 'COUSIN',
}

export class CreatePatientRelationshipDto {
  @IsEnum(RelationshipType)
  relationshipType: RelationshipType;

  @ValidateIf((o) => o.relationshipType === RelationshipType.FAMILY)
  @IsEnum(FamilyRelationship)
  familyRelationship?: FamilyRelationship;

  @ValidateIf((o) => o.relationshipType === RelationshipType.OTHER)
  @IsString()
  customRelationship?: string;
}
