import { Ref, getModelForClass, prop } from '@typegoose/typegoose'
import { AccountType } from '../../utils'
import { BaseEntity } from './base.entity'
import { User } from './user.model'

export class Product extends BaseEntity {
  @prop({ required: true })
  declare pin: string

  @prop({ required: true })
  declare cvv: string

  @prop({ required: true })
  declare expirationDate: string

  @prop({ required: true })
  declare cardNumber: string

  @prop({ required: true })
  declare cardHolder: string

  @prop({ default: 0 })
  declare balance: number

  @prop({ enum: AccountType, default: AccountType.SAVINGS })
  declare type: AccountType

  @prop({ required: true, ref: () => User })
  declare user: Ref<User>
}

export const ProductModel = getModelForClass(Product)
