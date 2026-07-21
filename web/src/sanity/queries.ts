import {defineQuery} from 'next-sanity'

export const SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  siteTitle, tagline, domain, intro
}`)

export const FEATURED_STORIES_QUERY = defineQuery(`*[_type == "story" && featured == true] | order(year asc)[0...4]{
  _id, title, "slug": slug.current, excerpt, year, location,
  "narrator": narrator->{name, "slug": slug.current}
}`)

export const LATEST_STORIES_QUERY = defineQuery(`*[_type == "story"] | order(publishedAt desc)[0...8]{
  _id, title, "slug": slug.current, excerpt, year, location, era,
  "narrator": narrator->{name, "slug": slug.current},
  mainImage
}`)

export const ALL_STORIES_QUERY = defineQuery(`*[_type == "story"] | order(year asc){
  _id, title, "slug": slug.current, excerpt, year, location, era,
  "narrator": narrator->{name, "slug": slug.current},
  "people": people[]->{name, "slug": slug.current},
  mainImage
}`)

export const STORY_QUERY = defineQuery(`*[_type == "story" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, excerpt, year, location, era, body, publishedAt,
  mainImage,
  "narrator": narrator->{name, "slug": slug.current, role, portrait},
  "people": people[]->{name, "slug": slug.current, role, portrait},
  "themes": themes[]->{title, "slug": slug.current}
}`)

export const PEOPLE_QUERY = defineQuery(`*[_type == "person"] | order(name asc){
  _id, name, "slug": slug.current, role, yearsActive, location, portrait, featured
}`)

export const FEATURED_PEOPLE_QUERY = defineQuery(`*[_type == "person" && featured == true] | order(name asc)[0...8]{
  _id, name, "slug": slug.current, role, yearsActive, location, portrait
}`)

export const PERSON_QUERY = defineQuery(`*[_type == "person" && slug.current == $slug][0]{
  _id, name, "slug": slug.current, role, yearsActive, location, portrait, bio,
  "stories": *[_type == "story" && references(^._id)] | order(year asc){
    _id, title, "slug": slug.current, excerpt, year
  },
  "galleries": *[_type == "gallery" && references(^._id)] | order(year asc){
    _id, title, "slug": slug.current, year
  }
}`)

export const GALLERIES_QUERY = defineQuery(`*[_type == "gallery"] | order(year asc){
  _id, title, "slug": slug.current, description, year, location,
  "cover": photos[0],
  "photoCount": count(photos)
}`)

export const GALLERY_QUERY = defineQuery(`*[_type == "gallery" && slug.current == $slug][0]{
  _id, title, "slug": slug.current, description, year, location,
  "people": people[]->{name, "slug": slug.current},
  photos[]{
    ...,
    "people": people[]->{name, "slug": slug.current}
  }
}`)

export const PROGRAMME_QUERY = defineQuery(`*[_type == "programme"][0]{
  title, lede, body, timeline
}`)

export const HOME_COUNTS_QUERY = defineQuery(`{
  "stories": count(*[_type == "story"]),
  "people": count(*[_type == "person"]),
  "galleries": count(*[_type == "gallery"])
}`)
