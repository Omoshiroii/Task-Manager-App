import React, { useState, useEffect } from 'react';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [filter, setFilter] = useState('all');
  const [streak, setStreak] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState(null);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [selectedPriority, setSelectedPriority] = useState('medium');
  const [selectedCategory, setSelectedCategory] = useState('personal');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  const priorities = {
    low: { color: 'bg-emerald-200', label: 'Low' },
    medium: { color: 'bg-amber-200', label: 'Medium' },
    high: { color: 'bg-rose-200', label: 'High' }
  };

  const categories = {
    personal: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>, 
      label: 'Personal' 
    },
    work: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, 
      label: 'Work' 
    },
    fitness: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>, 
      label: 'Fitness' 
    },
    learning: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>, 
      label: 'Learning' 
    },
    shopping: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, 
      label: 'Shopping' 
    },
    other: { 
      icon: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
      label: 'Other' 
    }
  };

  const getTodayDate = () => new Date().toDateString();

  const checkStreak = () => {
    const today = getTodayDate();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (lastCompletedDate !== yesterday && lastCompletedDate !== today && lastCompletedDate) {
      setStreak(0);
    }
  };

  const calculateTodayCompleted = () => {
    const today = getTodayDate();
    const completed = tasks.filter(t => 
      t.completed && new Date(t.completedAt).toDateString() === today
    ).length;
    setTodayCompleted(completed);
  };

  useEffect(() => {
    checkStreak();
    calculateTodayCompleted();
  }, [tasks, lastCompletedDate]);

  const addTask = () => {
    if (!newTask.trim()) return;

    const task = {
      id: Date.now(),
      text: newTask,
      completed: false,
      priority: selectedPriority,
      category: selectedCategory,
      createdAt: new Date().toISOString(),
      completedAt: null
    };

    setTasks([task, ...tasks]);
    setNewTask('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addTask();
  };

  const startEdit = (task) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = (id) => {
    if (editText.trim()) {
      setTasks(tasks.map(t => t.id === id ? { ...t, text: editText } : t));
    }
    setEditingId(null);
    setEditText('');
  };

  const toggleTask = (id) => {
    const today = getTodayDate();
    
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const isNowCompleted = !task.completed;
        
        if (isNowCompleted) {
          const wasTodayCompleted = tasks.filter(t => 
            t.completed && new Date(t.completedAt).toDateString() === today
          ).length;
          
          if (wasTodayCompleted === 0 && lastCompletedDate !== today) {
            const yesterday = new Date(Date.now() - 86400000).toDateString();
            if (lastCompletedDate === yesterday) {
              setStreak(s => s + 1);
            } else {
              setStreak(1);
            }
          }
          
          setLastCompletedDate(today);
          
          return {
            ...task,
            completed: true,
            completedAt: new Date().toISOString()
          };
        } else {
          return {
            ...task,
            completed: false,
            completedAt: null
          };
        }
      }
      return task;
    }));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  const filteredTasks = tasks
    .filter(task => {
      if (filter === 'active') return !task.completed;
      if (filter === 'completed') return task.completed;
      return true;
    })
    .filter(task => {
      if (categoryFilter === 'all') return true;
      return task.category === categoryFilter;
    })
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    active: tasks.filter(t => !t.completed).length
  };

  const progressPercentage = dailyGoal > 0 ? Math.min((todayCompleted / dailyGoal) * 100, 100) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a2980 0%, #26d0ce 100%)',
      padding: '60px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h1 style={{ fontSize: '48px', fontWeight: '300', color: 'white', marginBottom: '10px', letterSpacing: '3px' }}>
            TASK MANAGER
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '18px', fontWeight: '300' }}>
            Elegance in productivity
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '60px' }}>
          {[
            { label: 'Total Tasks', value: stats.total, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Completed', value: stats.completed, icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Current Streak', value: streak, icon: 'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z' },
            { label: 'Today', value: todayCompleted, icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'white', borderRadius: '20px', padding: '30px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', transition: 'transform 0.3s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <svg style={{ width: '24px', height: '24px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={stat.icon} />
                </svg>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '5px' }}>
                {stat.label}
              </p>
              <p style={{ fontSize: '40px', fontWeight: '300', color: '#1f2937' }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', marginBottom: '50px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg style={{ width: '22px', height: '22px', color: '#9ca3af' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <h2 style={{ fontSize: '24px', fontWeight: '300', color: '#1f2937' }}>Daily Goal</h2>
            </div>
            <input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(parseInt(e.target.value) || 0)}
              style={{ width: '80px', padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '10px', textAlign: 'center', fontSize: '16px', fontWeight: '300', color: '#374151' }}
              min="1"
            />
          </div>
          <div style={{ width: '100%', height: '8px', background: '#f3f4f6', borderRadius: '10px', overflow: 'hidden', marginBottom: '15px' }}>
            <div style={{ height: '100%', background: '#1f2937', width: `${progressPercentage}%`, transition: 'width 0.7s ease-out' }} />
          </div>
          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', fontWeight: '300' }}>
            {todayCompleted} of {dailyGoal} tasks completed
          </p>
        </div>

        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)', marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What would you like to accomplish?"
              style={{ flex: 1, padding: '15px 20px', border: '1px solid #d1d5db', borderRadius: '12px', fontSize: '18px', fontWeight: '300', color: '#374151' }}
            />
            <button
              onClick={addTask}
              style={{ padding: '15px 35px', background: '#1f2937', color: 'white', border: 'none', borderRadius: '12px', fontSize: '18px', fontWeight: '300', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)' }}
            >
              <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
              Add
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            <div>
              <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                Priority Level
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {Object.entries(priorities).map(([key, val]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPriority(key)}
                    style={{
                      flex: 1,
                      padding: '12px',
                      border: selectedPriority === key ? `2px solid ${key === 'low' ? '#a7f3d0' : key === 'medium' ? '#fde68a' : '#fecaca'}` : '1px solid #d1d5db',
                      background: selectedPriority === key ? (key === 'low' ? '#ecfdf5' : key === 'medium' ? '#fffbeb' : '#fef2f2') : 'white',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '300',
                      color: selectedPriority === key ? (key === 'low' ? '#059669' : key === 'medium' ? '#d97706' : '#dc2626') : '#6b7280',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    {val.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#6b7280', fontSize: '12px', fontWeight: '300', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '12px' }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '100%', padding: '12px 15px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', fontWeight: '300', color: '#374151', background: 'white', cursor: 'pointer' }}
              >
                {Object.entries(categories).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '50px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['all', 'active', 'completed'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '12px 25px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: filter === f ? 'white' : 'rgba(255, 255, 255, 0.1)',
                  color: filter === f ? '#1f2937' : 'white',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '300',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: filter === f ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoryFilter('all')}
              style={{
                padding: '12px 20px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: categoryFilter === 'all' ? 'white' : 'rgba(255, 255, 255, 0.1)',
                color: categoryFilter === 'all' ? '#1f2937' : 'white',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                boxShadow: categoryFilter === 'all' ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none'
              }}
            >
              All Categories
            </button>
            {Object.entries(categories).map(([key, val]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                style={{
                  padding: '12px 20px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  background: categoryFilter === key ? 'white' : 'rgba(255, 255, 255, 0.1)',
                  color: categoryFilter === key ? '#1f2937' : 'white',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: categoryFilter === key ? '0 4px 15px rgba(0, 0, 0, 0.1)' : 'none'
                }}
              >
                {val.icon}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
              <p style={{ fontSize: '20px', fontWeight: '300', color: '#9ca3af' }}>
                {filter === 'completed' ? 'No completed tasks yet' : 'No tasks yet. Create one above.'}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                style={{
                  background: 'white',
                  borderRadius: '20px',
                  padding: '25px',
                  boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '20px',
                  opacity: task.completed ? 0.6 : 1,
                  transition: 'all 0.3s'
                }}
              >
                <div
                  onClick={() => toggleTask(task.id)}
                  style={{
                    width: '28px',
                    height: '28px',
                    border: task.completed ? 'none' : '2px solid #d1d5db',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all 0.3s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: task.completed ? '#10b981' : 'transparent'
                  }}
                >
                  {task.completed && (
                    <svg style={{ width: '18px', height: '18px' }} fill="white" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  )}
                </div>

                <div style={{
                  width: '4px',
                  height: '50px',
                  borderRadius: '10px',
                  background: task.priority === 'low' ? '#10b981' : task.priority === 'medium' ? '#f59e0b' : '#ef4444',
                  flexShrink: 0
                }} />
                
                {editingId === task.id ? (
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && saveEdit(task.id)}
                    onBlur={() => saveEdit(task.id)}
                    style={{ flex: 1, padding: '10px 15px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '16px', fontWeight: '300', color: '#374151' }}
                    autoFocus
                  />
                ) : (
                  <span style={{
                    flex: 1,
                    fontSize: '18px',
                    fontWeight: '300',
                    color: '#374151',
                    textDecoration: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.75 : 1
                  }}>
                    {task.text}
                  </span>
                )}

                <div style={{ width: '20px', height: '20px', color: '#6b7280' }}>
                  {categories[task.category].icon()}
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {!task.completed && (
                    <svg
                      onClick={() => startEdit(task)}
                      style={{ width: '20px', height: '20px', color: '#9ca3af', cursor: 'pointer', transition: 'color 0.3s' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  )}
                  <svg
                    onClick={() => deleteTask(task.id)}
                    style={{ width: '20px', height: '20px', color: '#9ca3af', cursor: 'pointer', transition: 'color 0.3s' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
              </div>
            ))
          )}
        </div>

        {stats.active > 0 && (
          <div style={{ marginTop: '60px', background: 'white', borderRadius: '20px', padding: '40px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '300', color: '#1f2937', marginBottom: '8px' }}>
              {stats.active} task{stats.active !== 1 ? 's' : ''} remaining
            </h3>
            <p style={{ fontSize: '16px', fontWeight: '300', color: '#6b7280' }}>
              Keep your {streak}-day streak going
            </p>
          </div>
        )}

      </div>
    </div>
  );
}