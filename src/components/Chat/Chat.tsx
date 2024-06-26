import { useEffect, useState } from 'react'
import { Message, User } from '@/types/Types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import ChatMessage from '@/components/ChatMessage/ChatMessage'
import { useAuth } from '@/components/auth-context'
import supabase from '@/lib/supabase'

interface ChatProps {
  otherUser: User
}

const Chat: React.FC<ChatProps> = ({ otherUser }) => {
  const { session } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    void fetchMessages()

    const channel = supabase
      .channel('messages')
      .on<Message>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload: { new: Message }) => {
          const newMessage = payload.new
          if (
            (newMessage.sender_id === session?.user?.id && newMessage.receiver_id === otherUser.auth_id) ||
            (newMessage.sender_id === otherUser.auth_id && newMessage.receiver_id === session?.user?.id)
          ) {
            setMessages((messages) => [...messages, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [session?.user?.id, otherUser.id])

  const fetchMessages = async () => {
    const { data } = await supabase
      .from<string, any>('messages')
      .select('*')
      .or(
        `and(sender_id.eq.${session?.user?.id},receiver_id.eq.${otherUser.auth_id}),` +
          `and(sender_id.eq.${otherUser.auth_id},receiver_id.eq.${session?.user?.id})`
      )
      .order('created_at', { ascending: true })

    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (newMessage.trim() && session?.user?.id) {
      const { error } = await supabase.from('messages').insert([
        {
          sender_id: session.user.id,
          receiver_id: otherUser.auth_id,
          content: newMessage.trim(),
        },
      ])

      if (error) console.error(error)
      setNewMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="p-4">
        <h2 className="text-lg font-bold">Chatting with {otherUser.username}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length > 0 ? (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} isCurrentUser={message.sender_id === session?.user?.id} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-gray-500">No messages yet</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 border-t border-gray-200 p-4">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          type="text"
          placeholder="Type your message"
        />
        <Button onClick={() => sendMessage} type="submit">
          Send
        </Button>
      </div>
    </div>
  )
}

export default Chat
