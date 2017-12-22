export function JSON(statusCode = 200) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async (req, res) => {
      try {
        const result = await method.bind(target)(req);

        return res.json({
          data: result
        })
      } catch (e) {
        console.log(e);
      }
    }
  }
}

export function defaultJSON() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async (req, res) => {
      try {
        return res.json(await method.bind(target)(req))
      } catch (e) {
        console.log(e);
      }
    }
  }
}