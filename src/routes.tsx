import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import ImportPage from './pages/ImportPage'
import LibraryPage from './pages/LibraryPage'
import CardView from './pages/CardView'
import ReviewPage from './pages/ReviewPage'
import SettingsPage from './pages/SettingsPage'
import NoteSchemaPage from './pages/NoteSchemaPage'
import NotFound from './pages/NotFound'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LibraryPage />
      },
      {
        path: 'import',
        element: <ImportPage />
      },
      {
        path: 'library',
        element: <LibraryPage />
      },
      {
        path: 'library/:id',
        element: <CardView />
      },
      {
        path: 'review',
        element: <ReviewPage />
      },
      {
        path: 'settings',
        element: <SettingsPage />
      },
      {
        path: 'help/schema',
        element: <NoteSchemaPage />
      },
      {
        path: '*',
        element: <NotFound />
      }
    ]
  }
])
