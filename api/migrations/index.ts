import type { Migration } from './types'
import initialSchema from './files/00000000000000_initial_schema'
import addMessagesExtraData from './files/20240101000001_add_messages_extra_data'
import addMaterialsIsPinned from './files/20240101000002_add_materials_is_pinned'

const migrations: Migration[] = [
  initialSchema,
  addMessagesExtraData,
  addMaterialsIsPinned,
]

export default migrations
