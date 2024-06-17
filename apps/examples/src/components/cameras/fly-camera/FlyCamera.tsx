import {
  Camera,
  EventDispatcher,
  Group,
  MathUtils,
  Quaternion,
  Scene,
  Spherical,
  Vector3,
} from "three"

const targetPosition = new Vector3()
const tempUp = new Vector3()
let num = 0

export class FlyCamera extends EventDispatcher {
  public object: Camera
  public domElement?: HTMLElement | null

  public enabled = true

  public directionAlongGround = new Vector3()

  public movementSpeed = 1.0
  public lookSpeed = 0.005

  public lookVertical = true
  public autoForward = false

  public activeLook = true

  public heightSpeed = false
  public heightCoef = 1.0
  public heightMin = 0.0
  public heightMax = 1.0

  public constrainVertical = false
  public verticalMin = 0
  public verticalMax = Math.PI

  public mouseDragOn = false
  public up = new Vector3(0, 1, 0)
  public container: Group

  // internals

  private autoSpeedFactor = 0.0

  private mouseX = 0
  private mouseY = 0

  private moveForward = false
  private moveBackward = false
  private moveLeft = false
  private moveRight = false
  private moveUp = false
  private moveDown = false

  private viewHalfX = 0
  private viewHalfY = 0

  private lat = 0
  private lon = 0

  private lookDirection = new Vector3()
  private target = new Vector3()
  private rotationVector = new Vector3()

  private spherical = new Spherical()
  private groundVector = new Vector3()
  private rightVector = new Vector3()
  private forwardVector = new Vector3()

  constructor(
    object: Camera,
    private scene: Scene,
    domElement?: HTMLElement | null,
  ) {
    super()
    this.object = object
    this.domElement = domElement
    this.container = new Group()
    console.log(this.object.position)
    this.container.position.copy(this.object.position)
    this.object.position.set(0, 0, 0)
    this.container.add(this.object)
    this.scene.add(this.container)
    num++
    console.log("how many", num)

    console.log(this.container, this.object)

    // this.lookAt(this.target)

    if (domElement) this.connect(domElement)
  }

  public connect = (domElement: HTMLElement): void => {
    domElement.setAttribute("tabindex", "-1")

    domElement.style.touchAction = "none"

    domElement.addEventListener("contextmenu", this.contextmenu)
    domElement.addEventListener("mousemove", this.onMouseMove)
    domElement.addEventListener("mousedown", this.onMouseDown)
    domElement.addEventListener("mouseup", this.onMouseUp)

    this.domElement = domElement

    window.addEventListener("keydown", this.onKeyDown)
    window.addEventListener("keyup", this.onKeyUp)

    this.handleResize()
  }

  public dispose = (): void => {
    this.domElement?.removeEventListener("contextmenu", this.contextmenu)
    this.domElement?.removeEventListener("mousedown", this.onMouseDown)
    this.domElement?.removeEventListener("mousemove", this.onMouseMove)
    this.domElement?.removeEventListener("mouseup", this.onMouseUp)

    window.removeEventListener("keydown", this.onKeyDown)
    window.removeEventListener("keyup", this.onKeyUp)
    this.container.remove(this.object)
    this.scene.remove(this.container)
    console.log("goodbye")
  }

  public handleResize = (): void => {
    if (this.domElement) {
      this.viewHalfX = this.domElement.offsetWidth / 2
      this.viewHalfY = this.domElement.offsetHeight / 2
    }
  }

  private onMouseDown = (event: MouseEvent): void => {
    this.domElement?.focus()

    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.moveForward = true
          break
        case 2:
          this.moveBackward = true
          break
      }
    }

    this.mouseDragOn = true
  }

  private onMouseUp = (event: MouseEvent): void => {
    if (this.activeLook) {
      switch (event.button) {
        case 0:
          this.moveForward = false
          break
        case 2:
          this.moveBackward = false
          break
      }
    }

    this.mouseDragOn = false
  }

  private onMouseMove = (event: MouseEvent): void => {
    if (this.domElement) {
      this.mouseX = event.pageX - this.domElement.offsetLeft - this.viewHalfX
      this.mouseY = event.pageY - this.domElement.offsetTop - this.viewHalfY
    }
  }

  private onKeyDown = (event: KeyboardEvent): void => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = true
        break

      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = true
        break

      case "ArrowDown":
      case "KeyS":
        this.moveBackward = true
        break

      case "ArrowRight":
      case "KeyD":
        this.moveRight = true
        break

      case "KeyR":
        this.moveUp = true
        break
      case "KeyF":
        this.moveDown = true
        break
    }
  }

  private onKeyUp = (event: KeyboardEvent): void => {
    switch (event.code) {
      case "ArrowUp":
      case "KeyW":
        this.moveForward = false
        break

      case "ArrowLeft":
      case "KeyA":
        this.moveLeft = false
        break

      case "ArrowDown":
      case "KeyS":
        this.moveBackward = false
        break

      case "ArrowRight":
      case "KeyD":
        this.moveRight = false
        break

      case "KeyR":
        this.moveUp = false
        break
      case "KeyF":
        this.moveDown = false
        break
    }
  }

  public lookAt = (position: Vector3): this => {
    this.target.copy(position)
    this.setOrientation()
    this.object.lookAt(this.target)
    return this
  }

  public getUpVector = (): Vector3 => {
    // get direction to the center line of the cylinder
    this.up.copy(this.object.position)
    tempUp.copy(this.object.position)
    this.up.x = 0
    this.up.z = 0

    this.up.copy(tempUp.sub(this.up).normalize().negate())
    return this.up
  }

  public orientContainer = (): void => {
    // Create a helper quaternion
    const quaternion = new Quaternion()

    // Vector pointing along the object's y-axis in its local coordinate system
    const yAxis = new Vector3(0, 1, 0)

    // Compute the quaternion that rotates the y-axis to the target direction
    quaternion.setFromUnitVectors(yAxis, this.up)

    // Apply the quaternion rotation to the object
    this.container.setRotationFromQuaternion(quaternion)
  }

  public update = (delta: number): void => {
    return
    if (!this.enabled) return

    this.object.up.copy(this.getUpVector())

    this.directionAlongCylinderSurface()

    if (this.heightSpeed) {
      const y = MathUtils.clamp(
        this.object.position.y,
        this.heightMin,
        this.heightMax,
      )
      const heightDelta = y - this.heightMin

      this.autoSpeedFactor = delta * (heightDelta * this.heightCoef)
    } else {
      this.autoSpeedFactor = 0.0
    }

    const actualMoveSpeed = delta * this.movementSpeed

    if (this.moveForward || (this.autoForward && !this.moveBackward)) {
      this.object.translateZ(-(actualMoveSpeed + this.autoSpeedFactor))
    }
    if (this.moveBackward) this.object.translateZ(actualMoveSpeed)

    if (this.moveLeft) this.object.translateX(-actualMoveSpeed)
    if (this.moveRight) this.object.translateX(actualMoveSpeed)

    if (this.moveUp) this.object.translateY(actualMoveSpeed)
    if (this.moveDown) this.object.translateY(-actualMoveSpeed)

    let actualLookSpeed = delta * this.lookSpeed

    if (!this.activeLook) {
      actualLookSpeed = 0
    }

    let verticalLookRatio = 1

    if (this.constrainVertical) {
      verticalLookRatio = Math.PI / (this.verticalMax - this.verticalMin)
    }

    this.lon -= this.mouseX * actualLookSpeed
    if (this.lookVertical)
      this.lat -= this.mouseY * actualLookSpeed * verticalLookRatio

    this.lat = MathUtils.clamp(this.lat, -85, 85)

    let phi = MathUtils.degToRad(90 - this.lat)
    const theta = MathUtils.degToRad(this.lon)

    if (this.constrainVertical) {
      phi = MathUtils.mapLinear(
        phi,
        0,
        Math.PI,
        this.verticalMin,
        this.verticalMax,
      )
    }

    const position = this.object.position

    // this.blah.position.set(0, 0, 0)
    // this.blah.translateZ(-1)
    // this.blah.getWorldPosition(targetPosition)
    // this.object.lookAt(targetPosition)
    // this.object.rotation.set(-phi, theta, 0)
  }

  private contextmenu = (event: Event): void => event.preventDefault()

  private directionAlongCylinderSurface = (): Vector3 => {
    // Given camera direction vector
    let cameraDirection = this.object.getWorldDirection(new Vector3())

    // // Given point on the cylinder surface
    // let pointOnCylinder = this.object.position

    // // Step 1: Calculate the cylinder's axis (assuming aligned with the Y-axis)
    // let cylinderAxis = new Vector3(0, 1, 0);

    // Step 2: Calculate the direction vector perpendicular to the cylinder axis
    // This is done by removing the Y component (projection onto the XZ plane)
    this.directionAlongGround.copy(cameraDirection)
    this.directionAlongGround.y = 0

    // Step 3: Normalize the direction vector to get the unit direction vector along the cylinder's surface
    this.directionAlongGround.normalize()

    return this.directionAlongGround
  }

  private setOrientation = (): void => {
    this.getUpVector()
    this.orientContainer()
    // this.lookDirection.set(0, 0, -1).applyQuaternion(this.object.quaternion)
    // this.container.up.copy(this.getUpVector())
    // // const cameraUpDirection = this.up
    // // const cameraForwardDirection = this.object.getWorldDirection(targetPosition)
    // // const cameraForwardDirectionAlongTheGround =
    // //   this.directionAlongCylinderSurface()
    // // const cameraRightDirection = cameraForwardDirection
    // //   .clone()
    // //   .cross(cameraUpDirection)
    // // const cameraHorizontalForward = cameraRightDirection
    // //   .clone()
    // //   .cross(cameraUpDirection)

    // this.lookDirection.set(0, 0, -1).applyQuaternion(this.object.quaternion)
    // this.spherical.setFromVector3(this.lookDirection)
    // this.lat = 90 - MathUtils.radToDeg(this.spherical.phi)
    // this.lon = MathUtils.radToDeg(this.spherical.theta)
  }
}
