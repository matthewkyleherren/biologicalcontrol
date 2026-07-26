'use client'

import {Tabs, type TabItem} from '@/components/ui'

export type ContributeMode = 'voice' | 'write'

const ITEMS: ReadonlyArray<TabItem<ContributeMode>> = [
  {id: 'voice', label: 'Tell it out loud'},
  {id: 'write', label: 'Write instead'},
]

export function ContributeModeTabs({
  value,
  onValueChange,
}: {
  value: ContributeMode
  onValueChange: (next: ContributeMode) => void
}) {
  return (
    <Tabs
      items={ITEMS}
      value={value}
      onValueChange={onValueChange}
      label="Choose how to contribute"
      className="mt-2"
    />
  )
}
