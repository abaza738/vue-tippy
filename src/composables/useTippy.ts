import tippy, { Instance, Props, Content } from 'tippy.js'
import {
  ref,
  onMounted,
  Ref,
  isRef,
  isReactive,
  isVNode,
  render,
  watch,
  VNode,
  h,
  onUnmounted,
  getCurrentInstance,
} from 'vue'
import { TippyOptions, TippyContent } from '../types'

tippy.setDefaultProps({
  //@ts-ignore
  onShow: instance => {
    if (!instance.props.content) return false
  },
})

export function useTippy(
  el: Element | (() => Element) | Ref<Element> | Ref<Element | undefined>,
  opts: TippyOptions = {},
  settings: {
    mount: boolean
  } = { mount: true }
) {
  const instance = ref<Instance>()

  let container: Element | null = null

  const getContainer = () => {
    if (container) return container
    container = document.createElement('fragment')
    return container
  }

  const getContent = (content: TippyContent): Content => {
    let newContent: Content

    let unwrappedContent: Content | VNode | { render: Function } = isRef(
      content
    )
      ? content.value
      : content

    if (isVNode(unwrappedContent)) {
      render(unwrappedContent, getContainer())
      newContent = () => getContainer()
    } else if (typeof unwrappedContent === 'object') {
      render(h(unwrappedContent), getContainer())
      newContent = () => getContainer()
    } else {
      newContent = unwrappedContent
    }

    return newContent
  }

  const getProps = (opts: TippyOptions): Partial<Props> => {
    let options: any = {}

    if (isRef(opts)) {
      options = opts.value
    } else if (isReactive(opts)) {
      options = { ...opts }
    } else {
      options = { ...opts }
    }

    if (options.content) options.content = getContent(options.content)

    return options as Props
  }

  const refresh = () => {
    if (!instance.value) return

    instance.value.setProps(getProps(opts))
  }

  const refreshContent = () => {
    if (!instance.value || !opts.content) return

    instance.value.setContent(getContent(opts.content))
  }

  const setContent = (value: TippyContent) => {
    instance.value?.setContent(getContent(value))
  }

  const setProps = (value: TippyOptions) => {
    instance.value?.setProps(getProps(value))
  }

  const destroy = () => {
    if (instance.value) {
      try {
        //@ts-ignore
        // delete instance.value.reference.$tippy
      } catch (error) {}

      instance.value.destroy()
      instance.value = undefined
    }
    container = null
  }

  const show = () => {
    instance.value?.show()
  }

  const hide = () => {
    instance.value?.hide()
  }

  const disable = () => {
    instance.value?.disable()
  }

  const enable = () => {
    instance.value?.enable()
  }

  const unmount = () => {
    instance.value?.unmount()
  }

  const mount = () => {
    if (!el) return

    let target = isRef(el) ? el.value : el

    if (typeof target === 'function') target = target()

    if (target) {
      instance.value = tippy(target, getProps(opts))

      //@ts-ignore
      target.$tippy = response
    }
  }

  const response = {
    tippy: instance,
    refresh,
    refreshContent,
    setContent,
    setProps,
    destroy,
    hide,
    show,
    disable,
    enable,
    unmount,
    mount,
  }

  if (settings.mount) {
    const vm = getCurrentInstance()

    if (vm) {
      if (vm.isMounted) {
        mount()
      } else {
        onMounted(mount)
      }

      onUnmounted(() => {
        destroy()
      })
    } else {
      mount()
    }
  }

  if (isRef(opts) || isReactive(opts)) {
    watch(opts, refresh, { immediate: false })
  } else if (isRef(opts.content)) {
    watch(opts.content, refreshContent, { immediate: false })
  }

  return response
}