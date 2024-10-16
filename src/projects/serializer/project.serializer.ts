// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
// import { Expose } from 'class-transformer';

// import { ModelSerializer } from 'src/common/serializer/model.serializer';

// export const adminUserGroupsForSerializing: string[] = ['admin'];
// export const basicFieldGroupsForSerializing: string[] = ['basic'];

// export class ProjectSerializer extends ModelSerializer {
//   id: number;

//   @ApiProperty()
//   name: string;

//   @ApiPropertyOptional()
//   @Expose({
//     groups: basicFieldGroupsForSerializing
//   })
//   description: string;

//   @ApiPropertyOptional()
//   @Expose({
//     groups: adminUserGroupsForSerializing
//   })
//   status: string;
//   @ApiPropertyOptional()
//   @Expose({
//     groups: adminUserGroupsForSerializing
//   })
//   nature: string;

//   @ApiPropertyOptional()
//   @Expose({
//     groups: basicFieldGroupsForSerializing
//   })
//   createdAt: Date;

//   @ApiPropertyOptional()
//   @Expose({
//     groups: basicFieldGroupsForSerializing
//   })
//   updatedAt: Date;
// }
