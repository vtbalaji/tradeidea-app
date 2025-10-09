'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '../../components/Navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useAccounts } from '../../contexts/AccountsContext';

const ACCOUNT_COLORS = [
  { name: 'Orange', value: '#ff8c42' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Yellow', value: '#f59e0b' },
  { name: 'Gray', value: '#6b7280' },
];

export default function AccountsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccount, setActiveAccount, createAccount, updateAccount, setDefaultAccount, loading } = useAccounts();

  console.log('Accounts Page - accounts:', accounts);
  console.log('Accounts Page - activeAccount:', activeAccount);
  console.log('Accounts Page - loading:', loading);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#ff8c42'
  });

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      alert('Please enter an account name');
      return;
    }

    try {
      await createAccount(formData.name, formData.description, formData.color);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', color: '#ff8c42' });
    } catch (error) {
      alert('Failed to create account');
    }
  };

  const handleUpdate = async () => {
    if (!editingAccount || !formData.name.trim()) {
      alert('Please enter an account name');
      return;
    }

    try {
      await updateAccount(editingAccount.id, {
        name: formData.name,
        description: formData.description,
        color: formData.color
      });
      setEditingAccount(null);
      setFormData({ name: '', description: '', color: '#ff8c42' });
    } catch (error) {
      alert('Failed to update account');
    }
  };

  const handleSetDefault = async (accountId: string) => {
    try {
      await setDefaultAccount(accountId);
    } catch (error) {
      alert('Failed to set default account');
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0f1419]">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Portfolio Accounts</h1>
          <p className="text-gray-600 dark:text-[#8b949e]">Manage multiple portfolio accounts (e.g., Personal, Spouse, Kids)</p>
        </div>

        {/* First-time user info */}
        {accounts.length === 1 && accounts[0].name === 'Primary' && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
            <div className="flex gap-3">
              <div className="text-2xl">ℹ️</div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">Welcome to Portfolio Accounts!</h3>
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Your <strong>Primary</strong> account has been created automatically. You can create additional accounts to track separate portfolios
                  (e.g., for family members). All your positions will be linked to an account.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Create Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            Create Account
          </button>
        </div>

        {/* Loading State */}
        {loading && accounts.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-[#ff8c42] mb-4"></div>
            <p className="text-gray-600 dark:text-[#8b949e]">Setting up your Primary account...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && accounts.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl">
            <p className="text-gray-600 dark:text-[#8b949e] mb-4">No accounts found. Creating your Primary account...</p>
          </div>
        )}

        {/* Accounts List */}
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.id}
              className={`bg-gray-50 dark:bg-[#1c2128] border rounded-xl p-6 transition-all ${
                activeAccount?.id === account.id
                  ? 'border-[#ff8c42] shadow-lg'
                  : 'border-gray-200 dark:border-[#30363d]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {/* Color Indicator */}
                  <div
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: account.color || '#6b7280' }}
                  />

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{account.name}</h3>
                      {account.isDefault && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-400">
                          Default
                        </span>
                      )}
                      {activeAccount?.id === account.id && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-500/20 text-green-400">
                          Active
                        </span>
                      )}
                    </div>
                    {account.description && (
                      <p className="text-sm text-gray-600 dark:text-[#8b949e]">{account.description}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {activeAccount?.id !== account.id && (
                    <button
                      onClick={() => setActiveAccount(account)}
                      className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-[#ff8c42] text-white hover:bg-[#ff9a58] transition-colors"
                    >
                      Switch
                    </button>
                  )}
                  {!account.isDefault && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditingAccount(account);
                      setFormData({
                        name: account.name,
                        description: account.description || '',
                        color: account.color || '#ff8c42'
                      });
                    }}
                    className="px-3 py-1.5 text-sm font-semibold rounded-lg bg-gray-200 dark:bg-[#30363d] text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-[#3d444d] transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAccount) && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setShowCreateModal(false);
            setEditingAccount(null);
            setFormData({ name: '', description: '', color: '#ff8c42' });
          }}
        >
          <div
            className="bg-white dark:bg-[#1c2128] border border-gray-200 dark:border-[#30363d] rounded-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingAccount ? 'Edit Account' : 'Create Account'}
            </h3>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Wife's Portfolio, Kids Fund"
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description"
                  className="w-full bg-white dark:bg-[#0f1419] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-gray-900 dark:text-white outline-none focus:border-[#ff8c42] transition-colors"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-[#8b949e] mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {ACCOUNT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setFormData({ ...formData, color: color.value })}
                      className={`h-10 rounded-lg transition-all ${
                        formData.color === color.value
                          ? 'ring-2 ring-offset-2 ring-[#ff8c42] scale-110'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingAccount(null);
                  setFormData({ name: '', description: '', color: '#ff8c42' });
                }}
                className="flex-1 bg-gray-100 dark:bg-[#30363d] hover:bg-gray-200 dark:hover:bg-[#3c444d] text-gray-900 dark:text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingAccount ? handleUpdate : handleCreate}
                className="flex-1 bg-[#ff8c42] hover:bg-[#ff9a58] text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {editingAccount ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
