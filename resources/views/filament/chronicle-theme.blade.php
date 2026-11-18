@include('project.theme')
@php($primary = app(\App\Support\ProjectPresentation::class)->admin()['primary'])
<style>
    :root { --admin-primary: {{ $primary }}; --admin-primary-hover: {{ $primary }}; }
    @if (config('project.admin.primary') === null)
        :root { --admin-primary-hover: var(--site-button-hover); }
    @endif
    .fi-body { background: var(--site-bg); color: var(--site-text); }
    .fi-topbar, .fi-sidebar { background: var(--site-chrome); }
    .fi-topbar { border-bottom: 1px solid var(--site-edge); }
    .fi-logo, .fi-header-heading { font-family: var(--site-font-heading); color: var(--site-heading); }
    .fi-ta-ctn, .fi-section, .fi-modal-window { background: var(--site-panel); border: 1px solid var(--site-edge); border-radius: var(--site-radius); box-shadow: 0 4px 0 var(--site-solid-shadow); }
    .fi-ta-table thead { background: var(--site-raised); }
    .fi-ta-row { border-color: var(--site-edge); }
    .fi-input-wrp { border: 1px solid var(--site-edge-bright); border-radius: var(--site-radius); background: var(--site-inset); }
    .fi-sidebar-item-btn, .fi-btn { border-radius: var(--site-radius); }
    .fi-btn.fi-color-primary { background: var(--admin-primary); color: var(--site-button-text); border: 1px solid var(--site-button-edge); box-shadow: 0 3px 0 var(--site-button-shadow); }
    .fi-btn.fi-color-primary:hover { background: var(--admin-primary-hover); color: var(--site-button-text); }
    .fi-btn.fi-color-primary .fi-icon { color: inherit; }
    .fi-sidebar-item.fi-active > .fi-sidebar-item-btn { background: var(--site-active); border-left: 2px solid var(--site-secondary); }
    .fi-sidebar-item-label, .fi-fo-field-wrp-label { color: var(--site-label); }
    .fi-section-header { border-bottom: 1px solid var(--site-edge); }
    .fi-section-header-heading { color: var(--admin-primary); }
</style>
