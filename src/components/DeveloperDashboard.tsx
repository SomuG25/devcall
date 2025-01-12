@@ .. @@
 import React, { useState, useRef } from 'react';
 import { useNavigate, Link } from 'react-router-dom';
+import { addCustomerRole, getCurrentUser } from '../lib/supabase';
 import {
   Video,
   User,
@@ .. @@
   const [saveSuccess, setSaveSuccess] = useState(false);
   const fileInputRef = useRef<HTMLInputElement>(null);
   
+  const handleBecomeCustomer = async () => {
+    try {
+      const user = await getCurrentUser();
+      if (user) {
+        await addCustomerRole(user.id);
+        alert('Customer account created successfully! You can now log in as a customer.');
+      }
+    } catch (error) {
+      console.error('Error creating customer account:', error);
+      alert('Failed to create customer account. Please try again.');
+    }
+  };
+
   // Profile state
@@ .. @@
             <button
               onClick={handleLogout}
               className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg"
+            >
+              <LogOut className="h-5 w-5" />
+              <span>Logout</span>
+            </button>
+
+            <button
+              onClick={handleBecomeCustomer}
+              className="w-full flex items-center space-x-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
             >
-              <LogOut className="h-5 w-5" />
-              <span>Logout</span>
+              <Users className="h-5 w-5" />
+              <span>Become a Customer</span>
             </button>
           </nav>
         </div>