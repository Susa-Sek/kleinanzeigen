# 🚀 Supabase Migrations - Schnellanleitung

## ✅ Schritt 1: Erste Migration (Schema)

**Ich habe bereits für dich:**
1. ✅ Die erste Migration in deine Zwischenablage kopiert
2. ✅ Den Supabase SQL Editor geöffnet

**Du musst nur noch:**
1. Im geöffneten Browser-Tab (Supabase SQL Editor):
   - Drücke `Strg + V` (Einfügen)
   - Klicke **"Run"** (unten rechts)
   - Warte auf Erfolg ✓

---

## ✅ Schritt 2: Zweite Migration (Realtime)

**Nach dem ersten Schritt:**

```sql
-- Kopiere diesen Code und führe ihn aus:

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable Realtime for conversations table (for unread count updates)
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
```

1. Klicke **"New query"** (oben links)
2. Füge den obigen Code ein
3. Klicke **"Run"**
4. Fertig! ✓

---

## 🎯 Schnellstart-Befehle (Falls Browser nicht öffnete)

```bash
# Migration 1 kopieren:
cd kleinanzeigen-app
cat supabase/migrations/20260212000001_initial_schema.sql | clip

# SQL Editor öffnen:
start https://supabase.com/dashboard/project/uyfogthmpmenivnyiioe/sql/new
```

---

## ✅ Überprüfung

Nach erfolgreicher Migration kannst du überprüfen:

1. Gehe zu: https://supabase.com/dashboard/project/uyfogthmpmenivnyiioe/editor
2. Du solltest sehen:
   - ✓ `accounts` Tabelle
   - ✓ `conversations` Tabelle
   - ✓ `messages` Tabelle
   - ✓ `sync_logs` Tabelle

---

## 🎉 Danach

Sobald die Migrations fertig sind:

1. **App testen:** https://kleinanzeigen-app-ten.vercel.app
2. **Account hinzufügen** → Gehe zu `/dashboard/accounts`
3. **Nachrichten checken** → Gehe zu `/dashboard/inbox`

---

**Bei Problemen:** Schreib mir einfach!
