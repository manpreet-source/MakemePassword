# Analytics event contract

Analytics records product behavior only. Event parameters must never contain generated credentials, manually entered credentials, clipboard contents, names, emails, or any other personal information.

| Event | Purpose | Safe parameters |
| --- | --- | --- |
| `page_view` | Public page traffic | `page_path` |
| `generator_opened` | Generator engagement | `generator_type` |
| `username_generated` | Username generator usage | `style`, `length_bucket` |
| `password_generated` | Password generator usage | `length_bucket` |
| `both_generated` | Combined generator usage | `generator_type: combined` |
| `username_checked` | Username checker usage | `strength` only |
| `password_checked` | Password checker usage | `strength` only |
| `username_regenerated` | Username regeneration | none or `style` |
| `password_regenerated` | Password regeneration | none or `length_bucket` |
| `credential_copied` | Copy action | `credential_type` only |
| `preset_selected` | Preset usage | `preset_type`, `preset_name` if non-sensitive |
| `advanced_options_opened` | Advanced controls usage | none |
| `theme_changed` | Theme preference | `theme` |
| `generator_mode_changed` | Switching between combined/username/password mode | `mode` |
| `recommendation_clicked` | Clicking "Generate a stronger password" from the checker | `generator_type` |

Never add parameters named `username`, `password`, `credential`, `clipboard`, `value`, or `text` to these events.

## Verification

1. Accept analytics consent on the public site.
2. Trigger a safe action such as generating a password.
3. Open GA4 Realtime or DebugView.
4. Confirm the event name and safe metadata arrive.
5. Inspect the event payload and confirm no credential value is present.
6. Reject consent and confirm generation/checking still works without a GA request.
