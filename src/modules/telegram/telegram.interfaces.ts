export type ChatType = 'private' | 'group' | 'supergroup' | 'channel'

export interface ApiResponse<T> {
  ok: boolean
  result: T
}

export interface Chat {
  id: number
  type: ChatType
  title?: string
}

export interface Message {
  message_id: number
  date: number
  text?: string
  chat: Chat
  message_thread_id?: number
}

export interface BotUpdate {
  update_id: number
  message?: Message
}

export type GetUpdatesApiResponse = ApiResponse<BotUpdate[]>

export interface SendMessageApiRequest {
  chat_id: number
  message_thread_id?: number
  text: string
}
