import React from 'react'
import {render, screen, waitFor} from '@testing-library/react'
import {queryCache} from 'react-query'
import * as auth from 'auth-provider'
import {buildUser, buildBook} from 'test/generate'
import * as usersDB from 'test/data/users'
import * as booksDB from 'test/data/books'
import {AppProviders} from 'context'
import {App} from 'app'

// general cleanup
afterEach(async () => {
  queryCache.clear()
  await Promise.all([auth.logout(), usersDB.reset(), booksDB.reset()])
})

test('renders all the book information', async () => {
  const user = buildUser()
  await usersDB.create(user)
  const authUser = usersDB.authenticate(user)
  window.localStorage.setItem(auth.localStorageKey, authUser.token)

  const book = await booksDB.create(buildBook())
  const route = `/book/${book.id}`
  window.history.pushState({}, 'Test page', route)

  render(<App />, {wrapper: AppProviders})

  await waitFor(() => {
    if (queryCache.isFetching) {
      throw new Error('The react-query queryCache is still fetching')
    }
    if (screen.queryByLabelText(/loading/i) || screen.queryByText(/loading/i)) {
      throw new Error('App loading indicators are still running')
    }
  })

  expect(screen.getByRole('heading', {name: book.title})).toBeInTheDocument()
  expect(screen.getByText(book.author)).toBeInTheDocument()
  expect(screen.getByText(book.publisher)).toBeInTheDocument()
  expect(screen.getByText(book.synopsis)).toBeInTheDocument()
  expect(screen.getByRole('img', {name: /book cover/i})).toHaveAttribute(
    'src',
    book.coverImageUrl,
  )
  expect(screen.getByRole('button', {name: /add to list/i})).toBeInTheDocument()

  expect(
    screen.queryByRole('button', {name: /remove from list/i}),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', {name: /mark as read/i}),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', {name: /mark as unread/i}),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('textbox', {name: /notes/i}),
  ).not.toBeInTheDocument()
  expect(screen.queryByRole('radio', {name: /star/i})).not.toBeInTheDocument()
  expect(screen.queryByLabelText(/start date/i)).not.toBeInTheDocument()
})
