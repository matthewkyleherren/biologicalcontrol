import {CogIcon} from '@sanity/icons'
import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  icon: CogIcon,
  fields: [
    defineField({
      name: 'siteTitle',
      type: 'string',
      initialValue: 'Biological Control Folklore',
    }),
    defineField({
      name: 'tagline',
      type: 'string',
      initialValue: 'Stories from the IITA Biological Control Programme, West Africa',
    }),
    defineField({
      name: 'domain',
      type: 'string',
      initialValue: 'biologicalcontrol.org',
    }),
    defineField({
      name: 'intro',
      type: 'text',
      rows: 4,
      description: 'Homepage positioning copy',
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site settings'}
    },
  },
})
