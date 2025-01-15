/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del()
  await knex('users').insert([
    {
      id: 1,
      real_name: 'Admin',
      email: 'admin@admin.com',
      username: 'admin123',//also the password
      hashed_password: 'e82316788a35470cfcc7b4a7178ee38071c2f3b05cd9bb1a29ff1f5dd3420b3c',
      salt: '28fe2f0c5b966b3d9a7c97e41cd93f4d',
      role: 'admin',
      avatar_img_url: 'null',
      is_active: true,
      fullname: null,
      phone_number: null,
      verified:true,
      created_at: new Date()
    },
    {
      id: 2,
      real_name: 'Customer',
      email: 'customer@customer.com',
      username: 'customer123',//also the password
      hashed_password: '8a839877eb6215040bd83cf380caed4b54c1b624510683887e419d9086bd14f0',
      salt: '14fe25733a43c48554be9c886a0f8f69',
      role: 'customer',
      avatar_img_url: 'null',
      is_active: true,
      fullname: null,
      phone_number: null,
      verified:true,
      created_at: new Date()
    },
  ]);
};
