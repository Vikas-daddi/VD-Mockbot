import React, { useState, useEffect } from 'react'
import { api } from '../api'

export default function AdminUsers() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    api.get('/admin/api/users')
      .then(res => setUsers(res.data))
      .catch(console.error)
  }, [])

  return (
    <div>
      <h2>Manage Users</h2>
      <table className="table">
        <thead>
          <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}><td>{u.id}</td><td>{u.username}</td><td>{u.email}</td><td>{u.role}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}