import Modifier from 'ember-modifier';
import {action} from '@ember/object';

export default class MovableModifier extends Modifier {
    moveThreshold = 3;

    active = false;
    currentX = undefined;
    currentY = undefined;
    initialX = undefined;
    initialY = undefined;
    xOffset = 0;
    yOffset = 0;

    addStartEventListeners() {
        this.element.addEventListener('touchstart', this.dragStart, false);
        this.element.addEventListener('mousedown', this.dragStart, false);
    }

    removeStartEventListeners() {
        this.element.removeEventListener('touchstart', this.dragStart, false);
        this.element.removeEventListener('mousedown', this.dragStart, false);
    }

    addActiveEventListeners() {
        window.addEventListener('touchend', this.dragEnd, {capture: true, passive: false});
        window.addEventListener('touchmove', this.drag, {capture: true, passive: false});
        window.addEventListener('mouseup', this.dragEnd, {capture: true, passive: false});
        window.addEventListener('mousemove', this.drag, {capture: true, passive: false});
    }

    removeActiveEventListeners() {
        window.removeEventListener('touchend', this.dragEnd, {capture: true, passive: false});
        window.removeEventListener('touchmove', this.drag, {capture: true, passive: false});
        window.removeEventListener('mouseup', this.dragEnd, {capture: true, passive: false});
        window.removeEventListener('mousemove', this.drag, {capture: true, passive: false});
    }

    removeEventListeners() {
        this.removeStartEventListeners();
        this.removeActiveEventListeners();
    }

    didReceiveArguments() {
        this.removeEventListeners();
        this.addStartEventListeners();
    }

    willDestroy() {
        this.removeEventListeners();
    }

    @action
    dragStart(e) {
        if (e.type === 'touchstart' || e.button === 0) {
            if (e.type === 'touchstart') {
                this.initialX = e.touches[0].clientX - this.xOffset;
                this.initialY = e.touches[0].clientY - this.yOffset;
            } else {
                this.initialX = e.clientX - this.xOffset;
                this.initialY = e.clientY - this.yOffset;
            }

            for (const elem of (e.path || e.composedPath())) {
                if (elem.matches('input, .ember-basic-dropdown-trigger')) {
                    break;
                }

                if (elem === this.element) {
                    this.addActiveEventListeners();
                    break;
                }
            }
        }
    }

    @action
    dragEnd(e) {
        e.preventDefault();
        e.stopPropagation();

        this.active = false;

        this.initialX = this.currentX;
        this.initialY = this.currentY;

        this.removeActiveEventListeners();
        this.enableScroll();

        // timeout required so immediate events blocked until the dragEnd has fully realised
        setTimeout(() => {
            this.enablePointerEvents();
        }, 5);
    }

    @action
    drag(e) {
        e.preventDefault();

        let eventX, eventY;

        if (e.type === 'touchmove') {
            eventX = e.touches[0].clientX;
            eventY = e.touches[0].clientY;
        } else {
            eventX = e.clientX;
            eventY = e.clientY;
        }

        if (!this.active) {
            if (
                Math.abs(Math.abs(this.initialX - eventX) - Math.abs(this.xOffset)) > this.moveThreshold ||
                Math.abs(Math.abs(this.initialY - eventY) - Math.abs(this.yOffset)) > this.moveThreshold
            ) {
                this.disableScroll();
                this.disablePointerEvents();
                this.active = true;
            }
        }

        if (this.active) {
            this.currentX = eventX - this.initialX;
            this.currentY = eventY - this.initialY;
            this.xOffset = this.currentX;
            this.yOffset = this.currentY;

            this.setTranslate(this.currentX, this.currentY);
        }
    }

    @action
    cancelClick(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    setTranslate(xPos, yPos) {
        this.element.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
    }

    disableScroll() {
        this.originalOverflow = this.element.style.overflow;
        this.element.style.overflow = 'hidden';
    }

    enableScroll() {
        this.element.style.overflow = this.originalOverflow;
    }

    // disabling pointer events prevents inputs being activated when drag finishes,
    // preventing clicks stops any event handlers that may otherwise result in the
    // movable element being closed when the drag finishes
    disablePointerEvents() {
        this.element.style.pointerEvents = 'none';
        window.addEventListener('click', this.cancelClick, {capture: true, passive: false});
    }

    enablePointerEvents() {
        this.element.style.pointerEvents = '';
        window.removeEventListener('click', this.cancelClick, {capture: true, passive: false});
    }
}
