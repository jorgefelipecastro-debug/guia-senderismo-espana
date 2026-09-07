import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = name => readFile(new URL(`../${name}`, import.meta.url), "utf8");

test("alias y conversaciones se solicitan por páginas estables", async () => {
  const source = await read("app/SocialChat.js");
  assert.match(source, /ALIASES_PAGE_SIZE=20/);
  assert.match(source, /CONVERSATIONS_PAGE_SIZE=15/);
  assert.match(source, /order\('alias'\)\.order\('user_id'\)\.range/);
  assert.match(source, /order\('created_at',\{ascending:false\}\)\.order\('id',\{ascending:false\}\)\.range/);
  assert.match(source, /Ver mensajes anteriores/);
});

test("quedadas, momentos y actividades tienen carga incremental", async () => {
  const [meetups, moments, routes, profile] = await Promise.all([
    read("app/Meetups.js"), read("app/Moments.js"), read("app/RouteCatalog.js"), read("app/ProfilePassport.js")
  ]);
  assert.match(meetups, /MEETUPS_PAGE_SIZE=20/);
  assert.match(meetups, /Ver más quedadas/);
  assert.match(moments, /MOMENTS_PAGE_SIZE = 24/);
  assert.match(moments, /Ver más momentos/);
  assert.match(routes, /\.range\(offset, offset \+ 19\)/);
  assert.match(routes, /Ver más actividades/);
  assert.doesNotMatch(profile, /limit\(1000\)/);
  assert.match(profile, /my_route_activity_duration_seconds/);
});

test("los índices cubren el orden de las páginas", async () => {
  const [sql, summary] = await Promise.all([read("supabase/migrations/20260907_paginated_community_indexes.sql"), read("supabase/migrations/20260907_paginated_activity_summary.sql")]);
  for (const index of ["social_aliases_alias_user_idx", "private_conversations_user_a_page_idx", "route_meetups_upcoming_page_idx", "moments_user_page_idx", "route_activities_user_page_idx"])
    assert.match(sql, new RegExp(index));
  assert.match(summary, /my_route_activity_duration_seconds/);
});
