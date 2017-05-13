using System.Collections.Generic;
using System.Web.Http;
using Herobook.Data;

namespace Herobook.Controllers.Api {
    public class ProfilesController : ApiController {

        private IDatabase database;
        public ProfilesController() {
            database = new DemoDatabase();
        }

        // GET api/<controller>
        public object Get() {
            return (database.ListProfiles());
        }

        // GET api/<controller>/5
        public string Get(int id) {
            return "value";
        }

        // POST api/<controller>
        public void Post([FromBody] string value) { }

        // PUT api/<controller>/5
        public void Put(int id, [FromBody] string value) { }

        // DELETE api/<controller>/5
        public void Delete(int id) { }
    }
}
