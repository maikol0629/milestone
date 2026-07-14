import { BadRequestException, PipeTransform } from '@nestjs/common'
import { z } from 'zod'

export class ZodValidationPipe implements PipeTransform {
  private schema: any

  constructor(schema: any) {
    this.schema = schema
  }

  transform(value: unknown) {
    const result = this.schema.safeParse(value)

    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Datos inválidos',
        details: z.treeifyError(result.error),
      })
    }

    return result.data
  }
}

export function createZodPipe(schema: any) {
  return new ZodValidationPipe(schema)
}
