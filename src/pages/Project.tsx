import React, { useState, useEffect } from 'react'
import supabase from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/components/auth-context'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Project {
  id: number
  user_id: string
  project_title: string
  project_description: string
  project_url: string
  created_at: string
  updates: Update[]
  tags: Tag[]
}

interface Update {
  id: number
  project_id: number
  update_content: string
  created_at: string
}

interface Tag {
  id: number
  name: string
  description: string
}

interface ComboBoxProps {
  options: Tag[]
  onChange: (selectedTags: Tag[]) => void
  value: Tag[]
  placeholder?: string
}

const ComboBox: React.FC<ComboBoxProps> = ({ options, onChange, value, placeholder }) => {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<Tag[]>(value)

  const handleSelectTag = (tag: Tag) => {
    const newSelectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t.id !== tag.id)
      : [...selectedTags, tag]
    setSelectedTags(newSelectedTags)
    onChange(newSelectedTags)
  }

  const handleCreateTag = async () => {
    const { data: newTag, error } = await supabase
      .from('tags')
      .insert({ name: searchTerm, description: '' })
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return
    }

    setSelectedTags([...selectedTags, newTag])
    onChange([...selectedTags, newTag])
    setSearchTerm('')
  }

  const filteredOptions = options.filter((option) => option.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {selectedTags.length > 0 ? selectedTags.map((tag) => tag.name).join(', ') : placeholder || 'Select tags...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="p-2">
          <input
            type="text"
            placeholder="Search tags..."
            className="mb-2 w-full rounded border border-gray-300 p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-gray-500">
              No tags found. <Button onClick={handleCreateTag}>Create "{searchTerm}"</Button>
            </div>
          ) : (
            <ul>
              {filteredOptions.map((option) => (
                <li
                  key={option.id}
                  className={`cursor-pointer p-2 ${selectedTags.includes(option) ? 'bg-gray-200' : ''}`}
                  onClick={() => handleSelectTag(option)}
                >
                  <Check className={cn('mr-2 h-4 w-4', selectedTags.includes(option) ? 'opacity-100' : 'opacity-0')} />
                  {option.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

const Project: React.FC = () => {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    url: '',
    tags: [] as Tag[],
  })
  const [newUpdate, setNewUpdate] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    fetchProjects()
    fetchTags()
  }, [])

  const fetchProjects = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session?.user?.id)
      .order('created_at', { ascending: false })

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      return
    }

    const projectIds = projectsData.map((project: Project) => project.id)
    const { data: updatesData, error: updatesError } = await supabase
      .from('project_updates')
      .select('*')
      .in('project_id', projectIds)

    if (updatesError) {
      console.error('Error fetching updates:', updatesError)
      return
    }

    const { data: haveTagsData, error: haveTagsError } = await supabase
      .from('have_tags')
      .select('project_id, tags_id, tags(name)')
      .in('project_id', projectIds)

    if (haveTagsError) {
      console.error('Error fetching project tags:', haveTagsError)
      return
    }

    const projectsWithUpdatesAndTags = projectsData.map((project: Project) => ({
      ...project,
      updates: updatesData.filter((update: Update) => update.project_id === project.id),
      tags: haveTagsData.filter((tag) => tag.project_id === project.id).map((tag) => tag.tags),
    }))

    setProjects(projectsWithUpdatesAndTags as unknown as Project[])
  }

  const fetchTags = async () => {
    const { data: tagsData, error: tagsError } = await supabase.from('tags').select('*')

    if (tagsError) {
      console.error('Error fetching tags:', tagsError)
      return
    }

    setTags(tagsData)
  }

  const handleTagChange = (selectedTags: Tag[]) => {
    setNewProject({ ...newProject, tags: selectedTags })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: session?.user?.id,
        project_title: newProject.title,
        project_description: newProject.description,
        project_url: newProject.url,
      })
      .select()

    if (projectError) {
      console.error('Error adding project:', projectError)
      return
    }

    const projectId = projectData[0].id

    const tagInserts = newProject.tags.map((tag) => ({
      project_id: projectId,
      tags_id: tag.id,
      created_at: new Date().toISOString(),
    }))

    const { error: tagError } = await supabase.from('have_tags').insert(tagInserts)

    if (tagError) {
      console.error('Error adding tags to project:', tagError)
      return
    }

    // Fetch all users except the current user
    const { data: users, error: usersError } = await supabase
      .from('users2')
      .select('auth_id')
      .neq('auth_id', session?.user?.id)

    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    const notifications = users.map((user: { auth_id: string }) => ({
      user_id: user.auth_id,
      content: `A new project titled "${newProject.title}" has been added.`,
      is_read: false,
    }))

    const { error: notificationError } = await supabase.from('notifications').insert(notifications)
    if (notificationError) {
      console.error('Error creating notifications:', notificationError)
      return
    }

    setNewProject({ title: '', description: '', url: '', tags: [] })
    fetchProjects()
  }

  const handleUpdateSubmit = async (projectId: number, event: React.FormEvent) => {
    event.preventDefault()

    const { error } = await supabase.from('project_updates').insert({
      project_id: projectId,
      update_content: newUpdate[projectId],
    })

    if (error) {
      console.error('Error adding update:', error)
      return
    }

    setNewUpdate({ ...newUpdate, [projectId]: '' })
    fetchProjects()
  }

  const renderUpdateCalendar = (updates: Update[]) => {
    const today = new Date()
    const daysInMonth = today.getDate()
    const updateDates = updates.map((update) => new Date(update.created_at).getDate())

    return (
      <div className="mt-2 flex gap-1">
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <div
            key={day}
            className={`flex h-6 w-6 items-center justify-center border ${
              updateDates.includes(day) ? 'bg-white text-black' : 'bg-black text-white'
            }`}
          >
            {updateDates.includes(day) ? '✔️' : day}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex max-h-[90vh] w-full flex-col items-center p-4 text-white">
      <Card className="mb-8 w-full max-w-4xl">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Add New Project</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="mb-4 grid gap-4">
              <Input
                placeholder="Project Title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
              <Textarea
                placeholder="Project Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
              <Input
                placeholder="Project URL"
                value={newProject.url}
                onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
              />
              <ComboBox placeholder="Add Tags" options={tags} onChange={handleTagChange} value={newProject.tags} />
            </div>
            <Button type="submit" className="w-full">
              Add Project
            </Button>
          </form>
        </CardContent>
      </Card>

      <ScrollArea className="w-full max-w-4xl">
        {projects.map((project) => (
          <Card key={project.id} className="mb-4 shadow-lg">
            <CardHeader className="flex items-center justify-between rounded-t-lg bg-gradient-to-r from-purple-500 to-indigo-500 p-4">
              <CardTitle className="text-2xl font-semibold text-white">{project.project_title}</CardTitle>
            </CardHeader>
            <CardContent className="rounded-b-lg p-6">
              <p className="mt-4 text-gray-600">{project.project_description}</p>
              {project.project_url && (
                <a
                  href={project.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block text-blue-500 underline"
                >
                  {project.project_url}
                </a>
              )}
              <CardDescription className="mt-6 text-sm text-gray-500">
                {new Date(project.created_at).toLocaleDateString()}
              </CardDescription>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.length === 0 ? (
                    <span className="text-gray-500">No tags</span>
                  ) : (
                    project.tags.map((tag) => (
                      <span key={tag.id} className="inline-block rounded bg-gray-200 px-2 py-1 text-sm text-gray-800">
                        {tag.name}
                      </span>
                    ))
                  )}
                </div>
                <h3 className="mt-4 text-lg font-semibold">Updates</h3>
                {renderUpdateCalendar(project.updates)}
                {project.updates
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((update) => (
                    <div key={update.id} className="mt-2">
                      <p className="text-gray-600">{update.update_content}</p>
                      <p className="text-sm text-gray-500">{new Date(update.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                <form onSubmit={(e) => handleUpdateSubmit(project.id, e)} className="mt-4">
                  <Textarea
                    placeholder="Add an update"
                    value={newUpdate[project.id] || ''}
                    onChange={(e) => setNewUpdate({ ...newUpdate, [project.id]: e.target.value })}
                  />
                  <Button type="submit" className="mt-2">
                    Add Update
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  )
}

export default Project
